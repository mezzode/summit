import React, { Component } from 'react';

interface Props {
  imgs: HTMLImageElement[];
  spacing: number;
  onUrlChange: (canvasUrl: string|null) => void;
  className: string;
}

interface State {
  canvasUrl: string|null;
}

export class Canvas extends Component<Props> {
  public state: State = {
    canvasUrl: null,
  }
  
  private canvas = React.createRef<HTMLCanvasElement>();
  
  private imgsDiffer(a: HTMLImageElement[], b: HTMLImageElement[]) {
    if (a.length !== b.length) {
      return true;
    }
    return !a.every((aImg, i) => aImg === b[i]);
  }
  
  componentDidUpdate(prevProps: Props, prevState: State) {
    
    if (this.imgsDiffer(prevProps.imgs, this.props.imgs)) {
      this.updateCanvas();
    }
    
    if (prevState.canvasUrl !== this.state.canvasUrl) {
      // free old url
      if (prevState.canvasUrl) {
        URL.revokeObjectURL(prevState.canvasUrl);
      }
      this.props.onUrlChange(this.state.canvasUrl);
    }
  }
  
  private calcFullPositions(imgs: HTMLImageElement[], spacing: number) {
    const maxHeight = Math.max(...imgs.map(({height}) => height));
    
    let x = spacing;
    
    // calc positions (for drawing later since resizing the canvas clears it)
    const positions = [];
    for (const img of imgs) {
      // TODO: put plus signs in between imgs
      const y = (maxHeight - img.height) / 2;
      positions.push({ img, x, y, });
      x += img.width + spacing;
    }
    return {
      positions,
      fullWidth: x,
    }
  }
  
  private updateCanvas(): void {
    // clear old url
    this.setState({ canvasUrl: null });
    
    const {positions, fullWidth} = this.calcFullPositions(
      this.props.imgs,
      this.props.spacing,
    );
    if (positions.length === 0) {
      return;
    }
    
    const mainCanvas = this.canvas.current;
    if (!mainCanvas) {
      throw new Error('mainCanvas missing');
    }
    
    // change canvas dims
    const maxHeight = Math.max(...positions.map(({img}) => img.height));
    mainCanvas.height = maxHeight;
    mainCanvas.width = fullWidth;
    
    const ctx = mainCanvas.getContext('2d');
    if (!ctx) {
      throw new Error('ctx missing');
    }
    
    positions.forEach(({img, x, y}) => ctx.drawImage(
      img,
      x,
      y,
      img.width,
      img.height
    ));
    
    this.updateCanvasUrl(mainCanvas);
  }
      
  updateCanvasUrl(mainCanvas: HTMLCanvasElement) {
    if (!mainCanvas.toBlob) {
      // toBlob not supported, fall back to data url
      this.setState({ canvasUrl: mainCanvas.toDataURL() });
      return;
    }
    
    mainCanvas.toBlob(blob => {
      if (!blob) {
        throw new Error();
      }
      this.setState({ canvasUrl: URL.createObjectURL(blob) });
    });
  }
  
  render() {
    return this.props.imgs.length > 0 && (
      <canvas ref={this.canvas} className={this.props.className}/>
    );
  }
}
