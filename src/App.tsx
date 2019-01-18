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

const delIndex = <T extends {}>(arr: T[], index: number): T[] => {
  const arrCopy = [...arr];
  arrCopy.splice(index, 1);

  return arrCopy;
};

const calcDefaultSpacing = (img: HTMLImageElement): number => {
  const defaultSpacingFactor = 0.2;

  return img.width * defaultSpacingFactor;
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
  spacingOpen: boolean;
}

export class App extends Component<Props, State> {
  public state: State = {
    canvasUrl: null,
    imgs: [],
    remoteUrl: null,
    spacingInput: '',
    spacingOpen: false,
  };

  private fileInput = React.createRef<HTMLInputElement>();

  public render() {
    const {
      remoteUrl,
      spacingInput,
      canvasUrl,
      imgs,
      spacingOpen,
    } = this.state;
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
        {imgs.length > 0 && (
          <DragDropContext onDragEnd={this.onDragEnd}>
            <Droppable droppableId='droppable'>
              {(provided, snapshot) => (
                <div ref={provided.innerRef}>
                  {imgs.map((item, index) => (
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
                          style={{
                            ...providedDraggable.draggableProps.style,
                            alignItems: 'center',
                            display: 'flex',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span>{item.name}</span>
                          <button
                            onClick={this.removeImg(index)}
                            className='button button-clear'
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <button
              className='button button-outline'
              onClick={this.clear}
              disabled={imgs.length === 0}
            >
              Clear
            </button>
            {canvasUrl ? (
              <a className='button' href={canvasUrl} download='header.png'>
                Save
              </a>
            ) : (
              <a className='button disabled-link-btn'>Save</a>
            )}
            <button
              className={`button${!spacingOpen ? ' button-outline' : ''}`}
              onClick={this.toggleSpacing}
            >
              Edit Spacing
            </button>
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <FileInput
              id='fileInput'
              accept='image/*'
              className='button button-outline'
              multiple
              forwardedRef={this.fileInput}
              onChange={this.addLocal}
            >
              Add local images
            </FileInput>
            <button
              className={`button${remoteUrl === null ? ' button-outline' : ''}`}
              onClick={this.toggleRemote}
            >
              Add from URL
            </button>
          </div>
        </div>
        {remoteUrl !== null && (
          <div
            style={{
              alignItems: 'center',
              display: 'flex',
            }}
          >
            <input
              type='text'
              onChange={this.changeUrl}
              value={remoteUrl}
              placeholder='URL'
            />
            <button className='button button-outline' onClick={this.addRemote}>
              Add
            </button>
          </div>
        )}
        {spacingOpen && (
          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              justifyContent: 'center',
              marginTop: 4,
            }}
          >
            <label htmlFor='spacing'>Spacing (px)</label>
            <input
              id='spacing'
              type='number'
              onChange={this.changeSpacing}
              value={spacingInput}
              style={{
                marginLeft: 12,
                maxWidth: 100,
              }}
            />
          </div>
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
    const newImgs = Array.from(files).map(f => {
      const url = URL.createObjectURL(f);
      const img = new Image();
      img.src = url;

      img.addEventListener('load', () => {
        loaded += 1;
        if (loaded === toLoad) {
          // All loaded
          const { imgs, spacingInput } = this.state;
          const widestImg = newImgs.reduce((widest, curr) =>
            widest.img.width > curr.img.width ? widest : curr,
          );
          this.setState({
            imgs: [...imgs, ...newImgs],
            spacingInput:
              imgs.length === 0
                ? calcDefaultSpacing(widestImg.img).toString()
                : spacingInput,
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

  private addRemote: MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault();
    const { imgs, remoteUrl, spacingInput } = this.state;
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
        spacingInput:
          imgs.length === 0 ? calcDefaultSpacing(img).toString() : spacingInput,
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

    const imgs = reorder(this.state.imgs, source.index, destination.index);

    this.setState({
      imgs,
    });
  }

  private onUrlChange = (canvasUrl: string | null) => {
    this.setState({ canvasUrl });
  }

  private removeImg = (
    index: number,
  ): MouseEventHandler<HTMLButtonElement> => () =>
    this.setState({
      imgs: delIndex(this.state.imgs, index),
    })

  private toggleRemote = () => {
    this.setState({
      remoteUrl: this.state.remoteUrl === null ? '' : null,
    });
  }

  private toggleSpacing = () => {
    this.setState({
      spacingOpen: !this.state.spacingOpen,
    });
  }
}
