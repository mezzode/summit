import classNames from 'classnames';
import 'milligram';
import 'normalize.css';
import React, { ChangeEvent, Component, MouseEventHandler } from 'react';
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

const calcDefaultMargin = (img: HTMLImageElement): number => {
  const defaultMarginFactor = 0.1;

  return img.width * defaultMarginFactor;
};

interface Props {}

interface State {
  canvasUrl: string | null;
  imgs: Array<{
    img: HTMLImageElement;
    name: string;
  }>;
  marginInput: string;
  marginOpen: boolean;
  remoteUrl: string | null;
  spacingInput: string;
  spacingOpen: boolean;
}

export class App extends Component<Props, State> {
  public state: State = {
    canvasUrl: null,
    imgs: [],
    marginInput: '',
    marginOpen: false,
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
      marginOpen,
      marginInput,
    } = this.state;
    const margin = parseInt(this.state.marginInput, 10) || 0;
    const spacing = parseInt(this.state.spacingInput, 10) || 0;

    return (
      <div className='main container'>
        <h1>Article Header Generator</h1>
        <Canvas
          className='main-canvas'
          imgs={imgs.map(({ img }) => img)}
          margin={margin}
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
              className={classNames('button', !spacingOpen && 'button-outline')}
              onClick={this.toggleSpacing}
            >
              Edit Spacing
            </button>
            <button
              className={classNames('button', !marginOpen && 'button-outline')}
              onClick={this.toggleMargin}
            >
              Edit Margin
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
              id='remoteUrl'
              onChange={this.changeInput}
              value={remoteUrl}
              placeholder='URL'
            />
            <button className='button button-outline' onClick={this.addRemote}>
              Add
            </button>
          </div>
        )}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {spacingOpen && (
            <div
              style={{
                alignItems: 'center',
                display: 'flex',
                justifyContent: 'center',
                margin: '4px 12px',
              }}
            >
              <label htmlFor='spacing'>Spacing (px)</label>
              <input
                id='spacingInput'
                type='number'
                onChange={this.changeInput}
                value={spacingInput}
                style={{
                  marginLeft: 12,
                  maxWidth: 100,
                }}
              />
            </div>
          )}
          {marginOpen && (
            <div
              style={{
                alignItems: 'center',
                display: 'flex',
                justifyContent: 'center',
                margin: '4px 12px',
              }}
            >
              <label htmlFor='margin'>Margin (px)</label>
              <input
                id='marginInput'
                type='number'
                onChange={this.changeInput}
                value={marginInput}
                style={{
                  marginLeft: 12,
                  maxWidth: 100,
                }}
              />
            </div>
          )}
        </div>
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
          const { imgs, spacingInput, marginInput } = this.state;
          const widestImg = newImgs.reduce((widest, curr) =>
            widest.img.width > curr.img.width ? widest : curr,
          );
          this.setState({
            imgs: [...imgs, ...newImgs],
            marginInput:
              imgs.length === 0
                ? calcDefaultMargin(widestImg.img).toString()
                : marginInput,
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
    // Unnecessary? e.preventDefault();
    const { imgs, remoteUrl, spacingInput, marginInput } = this.state;
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
        marginInput:
          imgs.length === 0 ? calcDefaultMargin(img).toString() : marginInput,
        remoteUrl: '',
        spacingInput:
          imgs.length === 0 ? calcDefaultSpacing(img).toString() : spacingInput,
      });
    });
  }

  private changeInput = <T extends keyof State>(
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const newState: { [P in T]: State[P] } = { [e.target.id]: e.target.value };
    this.setState(newState);
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

  private toggleMargin = () => {
    this.setState({
      marginOpen: !this.state.marginOpen,
    });
  }

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
