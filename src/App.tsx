import React, { Component, ChangeEventHandler, EventHandler, MouseEventHandler } from 'react';
import 'milligram';
import 'normalize.css';
import './App.css';

interface Props {}

interface State {
  imgs: {
    name: string;
    img: HTMLImageElement;
  }[],
  remoteUrl: string|null;
  spacingInput: string;
  canvasUrl: string|null;
}

class App extends Component<Props, State> {
  public state: State = {
    imgs: [],
    remoteUrl: '',
    spacingInput: '40',
    canvasUrl: null,
  }

  private mainCanvas = React.createRef<HTMLCanvasElement>();
  private fileInput = React.createRef<HTMLInputElement>();

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

  private drawMiniPositions(spacing: number): void {
    this.clearCanvasUrl();
    const {positions, fullWidth} = this.calcFullPositions(
      this.state.imgs.map(img => img.img),
      spacing,
    );
    if (positions.length === 0) {
      return;
    }

    const mainCanvas = this.mainCanvas.current;
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

  addLocal = () => {
    const fileInput = this.fileInput.current;
    if (!fileInput) {
      return;
    }
    const files = fileInput.files;
    if (!files) {
      return;
    }

    const toLoad = files.length;
    let loaded = 0;
    const imgs = Array.from(files).map(f => {
      const url = URL.createObjectURL(f);
      const img = new Image();
      img.src = url;

      img.addEventListener('load', () => {
        console.log('loaded');
        loaded += 1;
        if (loaded === toLoad) {
          console.log('all loaded');
          this.drawMiniPositions(parseInt(this.state.spacingInput) || 0);
        }
      });

      return {
        img,
        name: f.name,
      };
    })

    this.setState({ 
      imgs: [...this.state.imgs, ...imgs],
    });

    // clear input
    fileInput.value = '';
  }

  addRemote = () => {
    const { imgs, remoteUrl } = this.state;
    if (remoteUrl === null) {
      throw new Error();
    }

    const img = new Image();
    img.src = remoteUrl;
    img.crossOrigin = 'anonymous';

    img.addEventListener('load', () => {
      const [name] = remoteUrl.split('/').slice(-1);
      this.setState({
        imgs: [...imgs, {
          img,
          name,
        }],
        remoteUrl: '',
      })
      this.drawMiniPositions(parseInt(this.state.spacingInput) || 0);
    });
  }

  clear: MouseEventHandler<HTMLButtonElement> = () => {
    this.clearCanvasUrl();
    this.setState({
      imgs: [],
    });
  }

  clearCanvasUrl() {
    const { canvasUrl } = this.state;
    this.setState({
      canvasUrl: null,
    });
    if (canvasUrl) {
      URL.revokeObjectURL(canvasUrl);
    }
  }

  changeUrl: ChangeEventHandler<HTMLInputElement> = e => {
    this.setState({ remoteUrl: e.target.value });
  }

  changeSpacing: ChangeEventHandler<HTMLInputElement> = e => {
    const spacingInput = e.target.value;
    this.setState({ spacingInput });
    // we need to pass spacing directly here since may draw before state has been updated
    this.drawMiniPositions(parseInt(spacingInput) || 0);
  }

  render() {
    const { remoteUrl, spacingInput, canvasUrl } = this.state;
    return (
      <div className="main container">
        <h1>Article Header Generator</h1>
        {this.state.imgs.length > 0 && <canvas ref={this.mainCanvas} className="main-canvas"/>}
        {this.state.imgs.map(img => <p key={img.img.src}>{img.name}</p>) /* TODO: proper component */}
        <input id="fileInput" type="file" accept="image/*" multiple ref={this.fileInput} hidden onChange={this.addLocal}/>
        <label htmlFor="fileInput" className="button">Add local images</label>
        <button className="button button-outline" onClick={this.addRemote}>Add from URL</button>
        <button className="button button-clear" onClick={this.clear}>Clear</button>
        {remoteUrl !== null && <input type="text" onChange={this.changeUrl} value={remoteUrl} />}
        <input type="number" onChange={this.changeSpacing} value={spacingInput}  />
        {canvasUrl ?
          <a className="button" href={canvasUrl} download="header.png">Save</a> :
          <a className="button disabled-link-btn">Save</a>
        }
      </div>
    );
  }
}

export default App;
