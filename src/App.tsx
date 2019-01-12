import React, { Component } from 'react';
import './App.css';

interface Props {}

interface State {
  imgs: {
    name: string;
    img: HTMLImageElement;
  }[]
}

class App extends Component<Props, State> {
  public state: State = {
    imgs: []
  }

  private mainCanvas = React.createRef<HTMLCanvasElement>();
  private fileInput = React.createRef<HTMLInputElement>();
  private static readonly spacing = 40;

  private calcFullPositions() {
    const imgs = this.state.imgs.map(img => img.img);

    const maxHeight = Math.max(...imgs.map(({height}) => height));

    let x = App.spacing;

    // calc positions (for drawing later since resizing the canvas clears it)
    const positions = [];
    for (const img of imgs) {
      // TODO: put plus signs in between imgs
      const y = (maxHeight - img.height) / 2;
      positions.push({ img, x, y, });
      x += img.width + App.spacing;
    }
    return {
      positions,
      fullWidth: x,
    }
  }

  private drawMiniPositions(): void {
    const {positions, fullWidth} = this.calcFullPositions();
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
  }

  add = () => {
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
      const url = window.URL.createObjectURL(f);
      const img = new Image();
      img.src = url;
      // may need to set img.crossorigin attr for non-local urls
      // see https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Using_images#Using_images_from_other_domains

      img.addEventListener('load', () => {
        console.log('loaded');
        loaded += 1;
        if (loaded === toLoad) {
          console.log('all loaded');
          this.drawMiniPositions();
        }
      });

      // maybe could use observables to make this a bit cleaner instead of counting
      // may be overkill tho

      return {
        img,
        name: f.name,
      };
    })

    this.setState({ imgs });

    // clear input
    fileInput.value = '';
  }

  render() {
    return (
      <div className="main container">
        <h1>Article Header Generator</h1>
        {this.state.imgs.length > 0 && <canvas ref={this.mainCanvas} className="main-canvas"/>}
        {this.state.imgs.map(img => <p key={img.img.src}>{img.name}</p>) /* TODO: proper component */}
        <input id="fileInput" type="file" accept="image/*" multiple ref={this.fileInput} hidden onChange={this.add}/>
        <label htmlFor="fileInput" className="button">Select Images</label>
      </div>
    );
  }
}

// either allow inputting image urls or allow selection of local images (or both).

// pwa should just be cache everything in folder since no server-side stuff.

// TODO:
// add a save button
// make canvas background transparent

export default App;
