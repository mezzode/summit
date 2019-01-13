import React, { Component } from 'react';

interface Props {
  className: string;
  imgs: HTMLImageElement[];
  spacing: number;
  onUrlChange(canvasUrl: string | null): void;
}

interface State {
  canvasUrl: string | null;
}

const imgsDiffer = (a: HTMLImageElement[], b: HTMLImageElement[]) => {
  if (a.length !== b.length) {
    return true;
  }

  return !a.every((aImg, i) => aImg === b[i]);
};

const calcPositions = (imgs: HTMLImageElement[], spacing: number) => {
  const maxHeight = Math.max(...imgs.map(({ height }) => height));

  let x = spacing;

  // Calc positions (for drawing later since resizing the canvas clears it)
  const positions = [];
  for (const img of imgs) {
    // TODO: put plus signs in between imgs
    const verticalWhitespace = 2; // Top and bottom
    const y = (maxHeight - img.height) / verticalWhitespace;
    positions.push({ img, x, y });
    x += img.width + spacing;
  }

  return {
    fullWidth: x,
    positions,
  };
};

export class Canvas extends Component<Props> {
  public state: State = {
    canvasUrl: null,
  };

  private canvas = React.createRef<HTMLCanvasElement>();

  public componentDidUpdate(prevProps: Props, prevState: State) {
    if (imgsDiffer(prevProps.imgs, this.props.imgs)) {
      this.updateCanvas();
    }

    if (prevState.canvasUrl !== this.state.canvasUrl) {
      // Free old url
      if (prevState.canvasUrl) {
        URL.revokeObjectURL(prevState.canvasUrl);
      }
      this.props.onUrlChange(this.state.canvasUrl);
    }
  }

  public render() {
    return (
      this.props.imgs.length > 0 && (
        <canvas ref={this.canvas} className={this.props.className} />
      )
    );
  }

  private updateCanvas(): void {
    // Clear old url
    this.setState({ canvasUrl: null });

    const { positions, fullWidth } = calcPositions(
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

    // Change canvas dims
    const maxHeight = Math.max(...positions.map(({ img }) => img.height));
    mainCanvas.height = maxHeight;
    mainCanvas.width = fullWidth;

    const ctx = mainCanvas.getContext('2d');
    if (!ctx) {
      throw new Error('ctx missing');
    }

    positions.forEach(({ img, x, y }) =>
      ctx.drawImage(img, x, y, img.width, img.height),
    );

    this.updateCanvasUrl(mainCanvas);
  }

  private updateCanvasUrl(mainCanvas: HTMLCanvasElement) {
    if (!mainCanvas.toBlob) {
      // Method toBlob not supported, fall back to data url
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
}
