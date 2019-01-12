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

  private previewCanvas = React.createRef<HTMLCanvasElement>();
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
    if (!positions) {
      return;
    }

    const previewCanvas = this.previewCanvas.current;
    if (!previewCanvas) {
      throw new Error('previewCanvas missing');
    }

    const scaleFactor = previewCanvas.width / fullWidth;

    // change canvas height
    const maxHeight = Math.max(...positions.map(({img}) => img.height));
    previewCanvas.height = maxHeight * scaleFactor;
    // TODO: adjust scaling so preview always fits in window

    const ctx = previewCanvas.getContext('2d');
    if (!ctx) {
      throw new Error('ctx missing');
    }

    positions.forEach(({img, x, y}) => ctx.drawImage(
      img,
      x * scaleFactor,
      y * scaleFactor,
      img.width * scaleFactor,
      img.height * scaleFactor
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

    this.setState({
      imgs: [...this.state.imgs, ...imgs],
    })

    // clear input
    fileInput.value = '';
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          Article Header Generator
        </header>
        <h1>Preview</h1>
        <canvas ref={this.previewCanvas} width={1000}/>
        {this.state.imgs.map(img => <p key={img.img.src}>{img.name}</p>) /* TODO: proper component */}
        <input type="file" accept="image/*" multiple ref={this.fileInput}/>
        <button onClick={this.add}>Add</button>
      </div>
    );
  }
}

// either allow inputting image urls or allow selection of local images (or both).

// pwa should just be cache everything in folder since no server-side stuff.

// TODO:
// add a save button
// add the calculation, etc. functionality
// make canvas background transparent

// will need a hidden canvas that is max size, and have the display canvas
// be displaying a scaled down version of the full image from the hidden canvas
// or could just store positions and render the scaled down version
// and only on export render to a full canvas

export default App;
