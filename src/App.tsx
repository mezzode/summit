import classNames from 'classnames';
import 'normalize.css';
// tslint:disable-next-line:ordered-imports so milligram overrides normalize
import 'milligram';
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
  imgs: ImageItem[];
  plusOpen: boolean;
  remoteUrl: string | null;
  spacingsOpen: boolean;
}

interface Settings {
  constrainHeight: boolean;
  endWithEquals: boolean;
  marginInput: string;
  plusLength: string;
  plusOn: boolean;
  plusWidth: string;
  spacingInput: string;
}

interface ImageItem {
  id: string;
  img: HTMLImageElement;
  name: string;
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

const validImage = (img: HTMLImageElement) => img.height > 0 && img.width > 0;

const calcDefaults = (imgItems: ImageItem[]): Settings => {
  const spacingRatio = 5;
  const plusLengthRatio = 2;
  const widthRatio = 3;

  // Basing horizontal spacing on widest width of scaled dims
  // Note we use the scaled width as we default to constrainHeight which scales
  // FIXME: refactor rescaling calculation to common function
  const imgs = imgItems.map(i => i.img);
  const minHeight = Math.min(...imgs.map(({ height }) => height));
  const widestWidth = Math.max(
    ...imgs.map(img => minHeight / (img.height / img.width)),
  );

  const spacing = widestWidth / spacingRatio;
  const plusLength = spacing / plusLengthRatio;
  const plusWidth = plusLength / widthRatio;

  const defaults = {
    constrainHeight: true,
    endWithEquals: false,
    marginInput: '0',
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
    constrainHeight: true,
    endWithEquals: false,
    imgs: [],
    marginInput: '',
    plusLength: '',
    plusOn: true,
    plusOpen: false,
    plusWidth: '',
    remoteUrl: null,
    spacingInput: '',
    spacingsOpen: false,
  };

  private fileInput = React.createRef<HTMLInputElement>();

  public render() {
    const {
      remoteUrl,
      spacingInput,
      canvasUrl,
      endWithEquals,
      imgs,
      spacingsOpen,
      marginInput,
      plusOn,
      plusOpen,
      plusLength,
      plusWidth,
      constrainHeight,
    } = this.state;
    const margin = inputToNum(marginInput);
    const spacing = inputToNum(spacingInput);
    const isEmpty = imgs.length === 0;

    const imageList = (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <Droppable droppableId='droppable'>
          {provided => (
            <div ref={provided.innerRef} className='list'>
              <small>Drag to reorder list</small>
              {imgs.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {providedDraggable => (
                    <div
                      ref={providedDraggable.innerRef}
                      {...providedDraggable.draggableProps}
                      {...providedDraggable.dragHandleProps}
                      style={{
                        ...providedDraggable.draggableProps.style,
                        // Need inline styles to avoid being overwritten
                        alignItems: 'center',
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span className='list-item'>{item.name}</span>
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
    );

    const mainControls = (
      <div className='control-container'>
        <div className='control-container'>
          <FileInput
            id='fileInput'
            accept='.png, .jpg, .svg, .bmp'
            className='button button-outline'
            forwardedRef={this.fileInput}
            onChange={this.addLocal}
          >
            Add local
          </FileInput>
          <button
            className={`button${remoteUrl === null ? ' button-outline' : ''}`}
            onClick={this.toggleRemote}
          >
            Add from URL
          </button>
        </div>
        <div className='control-container'>
          <button
            className='button button-outline'
            onClick={this.clear}
            disabled={isEmpty}
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
        </div>
      </div>
    );

    const secondaryControls = (
      <div className='control-container'>
        <button
          className={classNames('button', !spacingsOpen && 'button-clear')}
          onClick={this.toggle('spacingsOpen')}
          disabled={isEmpty}
        >
          Edit Spacings
        </button>
        <button
          className={classNames('button', !plusOpen && 'button-clear')}
          onClick={this.toggle('plusOpen')}
          disabled={isEmpty}
        >
          Edit Pluses
        </button>
        <button
          className='button button-clear'
          onClick={this.reset}
          disabled={isEmpty}
        >
          Use Default Settings
        </button>
      </div>
    );

    const spacingControls = (
      <div className='control-container'>
        <NumInput
          label='Spacing (px)'
          id='spacingInput'
          onChange={this.onInputChange}
          value={spacingInput}
        />
        <NumInput
          label='Margin (px)'
          id='marginInput'
          onChange={this.onInputChange}
          value={marginInput}
        />
        <button
          className='button button-clear'
          onClick={this.toggle('constrainHeight')}
        >
          {constrainHeight ? 'Unconstrain' : 'Constrain'} Height
        </button>
      </div>
    );

    const plusControls = (
      <div className='control-container'>
        <button className='button button-clear' onClick={this.toggle('plusOn')}>
          {plusOn ? 'Hide' : 'Show'} Pluses
        </button>
        <button
          className='button button-clear'
          onClick={this.toggle('endWithEquals')}
        >
          {endWithEquals ? 'Hide' : 'Show'} Equals
        </button>
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
      </div>
    );

    return (
      <div className='main container'>
        <h1 className='title'>Summit</h1>
        <h3>Article Header Maker</h3>
        <Canvas
          className='main-canvas'
          imgs={imgs.map(({ img }) => img)}
          margin={margin}
          spacing={spacing}
          onUrlChange={this.onUrlChange}
          plus={
            plusOn
              ? {
                  endWithEquals,
                  plusLength: inputToNum(plusLength),
                  plusWidth: inputToNum(plusWidth),
                }
              : null
          }
          constrainHeight={constrainHeight}
        />
        <p className='text-placeholder'>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut nec
          suscipit ex. Donec sagittis maximus nisi, sollicitudin consequat nisl
          pellentesque et. Nam ullamcorper diam id ex volutpat maximus. Praesent
          gravida erat quam, nec gravida magna pretium rutrum. Nulla in suscipit
          tellus. Nullam dapibus feugiat nulla in scelerisque. Pellentesque non
          risus sit amet neque pellentesque suscipit. Vivamus facilisis quis
          metus a vehicula. Morbi ultrices lorem ac nisl gravida, in venenatis
          augue suscipit. Proin vehicula sagittis arcu vel vehicula.
          Pellentesque et varius tellus, eget facilisis erat.
        </p>
        {imgs.length > 0 && imageList}
        {remoteUrl !== null && (
          <div className='input-container'>
            <input
              type='text'
              id='remoteUrl'
              onChange={this.onInputChange}
              value={remoteUrl}
              placeholder='URL'
              className='url-input'
            />
            <button className='button button-outline' onClick={this.addRemote}>
              Add
            </button>
          </div>
        )}
        <div>
          {mainControls}
          {secondaryControls}
        </div>
        {spacingsOpen && spacingControls}
        {plusOpen && plusControls}
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

    // Supports multiple files here but have disabled it on the input
    // (reason being inconsistent browser support on mobile)
    const toLoad = files.length;
    let loaded = 0;
    const newImgs = Array.from(files).map(f => {
      const url = URL.createObjectURL(f);
      const img = new Image();
      img.src = url;

      img.addEventListener('load', () => {
        loaded += 1;
        if (!validImage(img)) {
          alert(`Could not add "${f.name}" as it has zero height or width.`);
        }
        if (loaded === toLoad) {
          // All loaded
          this.setState(prevState => {
            const imgs = [
              ...prevState.imgs,
              ...newImgs.filter(i => validImage(i.img)),
            ];

            return {
              imgs,
              // Reset settings to avoid carrying over bad sizings
              // (e.g. big image then small image would've meant big plus remained)
              ...calcDefaults(imgs),
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
      if (!validImage(img)) {
        alert(`Could not add "${remoteUrl}" as it has zero height or width.`);

        return;
      }
      const [name] = remoteUrl.split('/').slice(-1);
      this.setState(prevState => {
        const imgs = [
          ...prevState.imgs,
          {
            id: uuidv4(),
            img,
            name,
          },
        ];

        return {
          imgs,
          remoteUrl: '',
          // Reset settings to avoid carrying over bad sizings
          // (e.g. big image then small image would've meant big plus remained)
          ...calcDefaults(imgs),
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

    this.setState(prevState => ({
      imgs: reorder(prevState.imgs, source.index, destination.index),
    }));
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
    this.setState(prevState => ({
      imgs: delIndex(prevState.imgs, index),
    }))

  private reset: MouseEventHandler<HTMLButtonElement> = () => {
    this.setState(prevState => calcDefaults(prevState.imgs));
  }

  private toggle = <T extends keyof State>(
    key: T,
  ): MouseEventHandler<HTMLButtonElement> => () => {
    this.setState(prevState => {
      // Workaround, see https://github.com/Microsoft/TypeScript/issues/13948
      const newState: Pick<State, T> = { [key]: !prevState[key] };

      return newState;
    });
  }

  private toggleRemote = () => {
    this.setState(prevState => ({
      remoteUrl: prevState.remoteUrl === null ? '' : null,
    }));
  }
}
