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
import uuidv4 from 'uuid';
import './App.css';
import { Canvas } from './Canvas';
import { FileInput } from './FileInput';
import { NumInput } from './NumInput';

interface Props {}

interface State extends Settings {
  canvasUrl: string | null;
  imgs: Array<{
    id: string;
    img: HTMLImageElement;
    name: string;
  }>;
  marginOpen: boolean;
  remoteUrl: string | null;
  spacingOpen: boolean;
}

interface Settings {
  marginInput: string;
  plusLength: string;
  plusOn: boolean;
  plusWidth: string;
  spacingInput: string;
}

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

const inputToNum = (input: string) => parseInt(input, 10) || 0;

const calcDefaults = (imgs: HTMLImageElement[]): Settings => {
  const marginRatio = 10;
  const spacingRatio = 5;
  const plusLengthRatio = 2;
  const widthFactor = 3;

  const widestImg = imgs.reduce((widest, curr) =>
    widest.width > curr.width ? widest : curr,
  );

  const margin = widestImg.width / marginRatio;
  const spacing = widestImg.width / spacingRatio;
  const plusLength = spacing / plusLengthRatio;
  const plusWidth = plusLength / widthFactor;

  const defaults = {
    marginInput: margin.toString(),
    plusLength: plusLength.toString(),
    plusOn: true,
    plusWidth: plusWidth.toString(),
    spacingInput: spacing.toString(),
  };

  return defaults;
};

export class App extends Component<Props, State> {
  public state: State = {
    canvasUrl: null,
    imgs: [],
    marginInput: '',
    marginOpen: false,
    plusLength: '',
    plusOn: true,
    plusWidth: '',
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
      plusOn,
      plusLength,
      plusWidth,
    } = this.state;
    const margin = inputToNum(marginInput);
    const spacing = inputToNum(spacingInput);

    return (
      <div className='main container'>
        <h1>Article Header Generator</h1>
        <Canvas
          className='main-canvas'
          imgs={imgs.map(({ img }) => img)}
          margin={margin}
          spacing={spacing}
          onUrlChange={this.onUrlChange}
          plus={
            plusOn
              ? {
                  plusLength: inputToNum(plusLength),
                  plusWidth: inputToNum(plusWidth),
                }
              : null
          }
        />
        {imgs.length > 0 && (
          <DragDropContext onDragEnd={this.onDragEnd}>
            <Droppable droppableId='droppable'>
              {(provided, snapshot) => (
                <div ref={provided.innerRef}>
                  {imgs.map((item, index) => (
                    <Draggable
                      key={item.id}
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
              onClick={this.toggle('spacingOpen')}
            >
              Edit Spacing
            </button>
            <button
              className={classNames('button', !marginOpen && 'button-outline')}
              onClick={this.toggle('marginOpen')}
            >
              Edit Margin
            </button>
            <button className='button button-outline' onClick={this.reset}>
              Reset
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
              onChange={this.onInputChange}
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
            <NumInput
              label='Spacing (px)'
              id='spacingInput'
              onChange={this.onInputChange}
              value={spacingInput}
            />
          )}
          {marginOpen && (
            <NumInput
              label='Margin (px)'
              id='marginInput'
              onChange={this.onInputChange}
              value={marginInput}
            />
          )}
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <NumInput
            label='Plus Length (px)'
            id='plusLength'
            onChange={this.onInputChange}
            value={plusLength}
            disabled={!plusOn}
          />
          <NumInput
            label='Plus Width (px)'
            id='plusWidth'
            onChange={this.onInputChange}
            value={plusWidth}
            disabled={!plusOn}
          />
          <button
            className={classNames('button', { 'button-outline': !plusOn })}
            onClick={this.toggle('plusOn')}
          >
            {plusOn ? 'Hide' : 'Show'} Pluses
          </button>
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
          this.setState(prevState => {
            const { imgs } = prevState;
            let defaults = {};
            if (imgs.length === 0) {
              // Set default values
              defaults = calcDefaults(newImgs.map(i => i.img));
            }

            return {
              imgs: [...prevState.imgs, ...newImgs],
              ...defaults,
            };
          });
        }
      });

      return {
        id: url,
        img,
        name: f.name,
      };
    });

    // Clear input
    fileInput.value = '';
  }

  private addRemote: MouseEventHandler<HTMLButtonElement> = e => {
    const { remoteUrl } = this.state;
    if (remoteUrl === null) {
      throw new Error();
    }

    const img = new Image();
    img.src = remoteUrl;
    img.crossOrigin = 'anonymous';

    img.addEventListener('load', () => {
      const [name] = remoteUrl.split('/').slice(-1);
      this.setState(prevState => {
        const { imgs } = prevState;
        const defaults = imgs.length === 0 ? calcDefaults([img]) : {};

        return {
          imgs: [
            ...imgs,
            {
              id: uuidv4(),
              img,
              name,
            },
          ],
          remoteUrl: '',
          ...defaults,
        };
      });
    });
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

  private onInputChange = <T extends keyof State>(
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const newState: Pick<State, T> = { [e.target.id]: e.target.value };
    this.setState(newState);
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

  private reset: MouseEventHandler<HTMLButtonElement> = () => {
    this.setState(prevState => calcDefaults(prevState.imgs.map(i => i.img)));
  }

  private toggle = <T extends keyof State>(
    key: T,
  ): MouseEventHandler<HTMLButtonElement> => () => {
    this.setState(prevState => {
      // Workaround, see https://github.com/Microsoft/TypeScript/issues/13948
      const newState: Pick<State, T> = { [key]: !this.state[key] };

      return newState;
    });
  }

  private toggleRemote = () => {
    this.setState({
      remoteUrl: this.state.remoteUrl === null ? '' : null,
    });
  }
}
