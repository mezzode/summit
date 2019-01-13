import React, { Component, ChangeEventHandler, MouseEventHandler } from 'react';
import {DragDropContext, Droppable, Draggable, OnDragEndResponder} from 'react-beautiful-dnd';
import 'milligram';
import 'normalize.css';
import './App.css';
import { Canvas } from './Canvas';

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

  private fileInput = React.createRef<HTMLInputElement>();

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
        loaded += 1;
        if (loaded === toLoad) {
          // all loaded
          this.setState({ 
            imgs: [...this.state.imgs, ...imgs],
          });
        }
      });

      return {
        img,
        name: f.name,
      };
    })

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
    });
  }

  clear: MouseEventHandler<HTMLButtonElement> = () => {
    this.setState({
      imgs: [],
    });
  }

  changeUrl: ChangeEventHandler<HTMLInputElement> = e => {
    this.setState({ remoteUrl: e.target.value });
  }

  changeSpacing: ChangeEventHandler<HTMLInputElement> = e => {
    const spacingInput = e.target.value;
    this.setState({ spacingInput });
  }

  reorder<T>(arr: T[], srcIndex: number, destIndex: number): T[] {
    const arrCopy = [...arr];
    const [moved] = arrCopy.splice(srcIndex, 1);
    arrCopy.splice(destIndex, 0, moved);
    return arrCopy;
  }

  onDragEnd: OnDragEndResponder = ({destination, source}) => {
    if (!destination) {
      // dropped outside list
      return;
    }

    const imgs = this.reorder(
      this.state.imgs,
      destination.index,
      source.index,
    );

    this.setState({
      imgs,
    });
  }

  onUrlChange = (canvasUrl: string|null) => {
    this.setState({ canvasUrl });
  }

  render() {
    const { remoteUrl, spacingInput, canvasUrl, imgs } = this.state;
    const spacing = parseInt(this.state.spacingInput) || 0;
    return (
      <div className="main container">
        <h1>Article Header Generator</h1>
        <Canvas
          className="main-canvas"
          imgs={imgs.map(({img}) => img)}
          spacing={spacing}
          onUrlChange={this.onUrlChange}
        />
        {this.state.imgs.map(img => <p key={img.img.src}>{img.name}</p>) /* TODO: proper component */}
        <DragDropContext onDragEnd={this.onDragEnd}>
          <Droppable droppableId="droppable">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
              >
                {this.state.imgs.map((item, index) => (
                  <Draggable key={item.img.src} draggableId={item.img.src} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        {item.name}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

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
