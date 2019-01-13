import 'milligram';
import 'normalize.css';
import React, { ChangeEventHandler, Component, MouseEventHandler } from 'react';
import {
  DragDropContext,
  Draggable,
  Droppable,
  OnDragEndResponder,
} from 'react-beautiful-dnd';
import './App.css';
import { Canvas } from './Canvas';
import { FileInput } from './FileInput';

const reorder = <T extends {}>(
  arr: T[],
  srcIndex: number,
  destIndex: number,
): T[] => {
  const arrCopy = [...arr];
  const [moved] = arrCopy.splice(srcIndex, 1);
  arrCopy.splice(destIndex, 0, moved);

  return arrCopy;
};

interface Props {}

interface State {
  canvasUrl: string | null;
  imgs: Array<{
    img: HTMLImageElement;
    name: string;
  }>;
  remoteUrl: string | null;
  spacingInput: string;
}

export class App extends Component<Props, State> {
  public state: State = {
    canvasUrl: null,
    imgs: [],
    remoteUrl: '',
    spacingInput: '40',
  };

  private fileInput = React.createRef<HTMLInputElement>();

  public render() {
    const { remoteUrl, spacingInput, canvasUrl, imgs } = this.state;
    const spacing = parseInt(this.state.spacingInput, 10) || 0;

    return (
      <div className='main container'>
        <h1>Article Header Generator</h1>
        <Canvas
          className='main-canvas'
          imgs={imgs.map(({ img }) => img)}
          spacing={spacing}
          onUrlChange={this.onUrlChange}
        />
        <DragDropContext onDragEnd={this.onDragEnd}>
          <Droppable droppableId='droppable'>
            {(provided, snapshot) => (
              <div ref={provided.innerRef}>
                {this.state.imgs.map((item, index) => (
                  <Draggable
                    key={item.img.src}
                    draggableId={item.img.src}
                    index={index}
                  >
                    {(providedDraggable, snapshotDraggable) => (
                      <div
                        ref={providedDraggable.innerRef}
                        {...providedDraggable.draggableProps}
                        {...providedDraggable.dragHandleProps}
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
        <FileInput
          id='fileInput'
          accept='image/*'
          className='button'
          multiple
          forwardedRef={this.fileInput}
          onChange={this.addLocal}
        >
          Add local images
        </FileInput>
        <button className='button button-outline' onClick={this.addRemote}>
          Add from URL
        </button>
        <button className='button button-clear' onClick={this.clear}>
          Clear
        </button>
        {remoteUrl !== null && (
          <input type='text' onChange={this.changeUrl} value={remoteUrl} />
        )}
        <input
          type='number'
          onChange={this.changeSpacing}
          value={spacingInput}
        />
        {canvasUrl ? (
          <a className='button' href={canvasUrl} download='header.png'>
            Save
          </a>
        ) : (
          <a className='button disabled-link-btn'>Save</a>
        )}
      </div>
    );
  }

  private addLocal = () => {
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
          // All loaded
          this.setState({
            imgs: [...this.state.imgs, ...imgs],
          });
        }
      });

      return {
        img,
        name: f.name,
      };
    });

    // Clear input
    fileInput.value = '';
  }

  private addRemote = () => {
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
        imgs: [
          ...imgs,
          {
            img,
            name,
          },
        ],
        remoteUrl: '',
      });
    });
  }

  private changeSpacing: ChangeEventHandler<HTMLInputElement> = e => {
    const spacingInput = e.target.value;
    this.setState({ spacingInput });
  }

  private changeUrl: ChangeEventHandler<HTMLInputElement> = e => {
    this.setState({ remoteUrl: e.target.value });
  }

  private clear: MouseEventHandler<HTMLButtonElement> = () => {
    this.setState({
      imgs: [],
    });
  }

  private onDragEnd: OnDragEndResponder = ({ destination, source }) => {
    if (!destination) {
      // Dropped outside list
      return;
    }

    const imgs = reorder(this.state.imgs, destination.index, source.index);

    this.setState({
      imgs,
    });
  }

  private onUrlChange = (canvasUrl: string | null) => {
    this.setState({ canvasUrl });
  }
}
