import React, { Component } from 'react';
import './Canvas.css';

interface Props {
  className: string;
  constrainHeight: boolean;
  imgs: HTMLImageElement[];
  margin: number;
  plus: Plus;
  spacing: number;
  onUrlChange(canvasUrl: string | null): void;
}

interface State {
  canvasUrl: string | null;
}

type Plus = {
  endWithEquals: boolean;
  plusLength: number;
  plusWidth: number;
} | null;

const imgsDiffer = (a: HTMLImageElement[], b: HTMLImageElement[]) => {
  if (a.length !== b.length) {
    return true;
  }

  return !a.every((aImg, i) => aImg === b[i]);
};

const plusDiffer = (a: Plus, b: Plus) => {
  if (a === b) {
    return false;
  } else if (a === null || b === null) {
    return true;
  }

  return (
    a.plusLength !== b.plusLength ||
    a.plusWidth !== b.plusWidth ||
    a.endWithEquals !== b.endWithEquals
  );
};

const calcPositions = (
  imgs: HTMLImageElement[],
  spacing: number,
  margin: number,
  constrainHeight: boolean,
) => {
  const verticalWhitespace = 2; // Top and bottom
  const maxHeight = Math.max(...imgs.map(({ height }) => height));
  const minHeight = Math.min(...imgs.map(({ height }) => height));
  const fullHeight =
    (constrainHeight ? minHeight : maxHeight) + margin * verticalWhitespace;

  let x = margin;

  // Calc positions (for drawing later since resizing the canvas clears it)
  const positions = [];
  for (const img of imgs) {
    let width;
    let height;
    if (constrainHeight) {
      width = minHeight / (img.height / img.width);
      height = minHeight;
    } else {
      width = img.width;
      height = img.height;
    }

    const y = (fullHeight - height) / verticalWhitespace;
    positions.push({ img, x, y, height, width });
    x += width + spacing;
  }
  x += margin - spacing;

  return {
    fullHeight,
    fullWidth: x,
    positions,
  };
};

const drawPlus = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  sideLength: number,
  lineWidth: number,
): void => {
  const half = sideLength / 2;
  ctx.beginPath();
  ctx.lineWidth = lineWidth;
  ctx.moveTo(x - half, y);
  ctx.lineTo(x + half, y);
  ctx.moveTo(x, y - half);
  ctx.lineTo(x, y + half);
  ctx.stroke();
};

const drawEquals = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  sideLength: number,
  lineWidth: number,
): void => {
  const quarter = sideLength / 4;
  const half = sideLength / 2;
  ctx.beginPath();
  ctx.lineWidth = lineWidth;
  ctx.moveTo(x - half, y - quarter);
  ctx.lineTo(x + half, y - quarter);
  ctx.moveTo(x - half, y + quarter);
  ctx.lineTo(x + half, y + quarter);
  ctx.stroke();
};

/**
 * Custom canvas wrapper for adapting declarative props to imperative Canvas API
 */
export class Canvas extends Component<Props> {
  public state: State = {
    canvasUrl: null,
  };

  private canvas = React.createRef<HTMLCanvasElement>();

  public componentDidUpdate(prevProps: Props, prevState: State) {
    if (
      imgsDiffer(prevProps.imgs, this.props.imgs) ||
      prevProps.spacing !== this.props.spacing ||
      prevProps.margin !== this.props.margin ||
      plusDiffer(prevProps.plus, this.props.plus) ||
      prevProps.constrainHeight !== this.props.constrainHeight
    ) {
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
    return this.props.imgs.length > 0 ? (
      <canvas ref={this.canvas} className={this.props.className} />
    ) : (
      <p className='image-placeholder'>
        <em>Add an image below</em>
      </p>
    );
  }

  private updateCanvas(): void {
    // Clear old url to prevent file being inconsistent with displayed canvas.
    this.setState({ canvasUrl: null });
    const { margin, spacing, plus, constrainHeight } = this.props;

    const { positions, fullHeight, fullWidth } = calcPositions(
      this.props.imgs,
      spacing,
      margin,
      constrainHeight,
    );
    if (positions.length === 0) {
      return;
    }

    const mainCanvas = this.canvas.current;
    if (!mainCanvas) {
      throw new Error('mainCanvas missing');
    }

    // Change canvas dims
    mainCanvas.height = fullHeight;
    mainCanvas.width = fullWidth;

    const ctx = mainCanvas.getContext('2d');
    if (!ctx) {
      throw new Error('ctx missing');
    }

    positions.forEach(({ img, x, y, height, width }, index) => {
      ctx.drawImage(img, x, y, width, height);

      if (plus) {
        // Draw pluses between images
        const { plusLength, plusWidth, endWithEquals } = plus;
        const halfFactor = 2;
        if (endWithEquals && index + 2 === positions.length) {
          drawEquals(
            ctx,
            x + width + spacing / halfFactor,
            fullHeight / halfFactor,
            plusLength,
            plusWidth,
          );
        } else if (index + 1 !== positions.length) {
          drawPlus(
            ctx,
            x + width + spacing / halfFactor,
            fullHeight / halfFactor,
            plusLength,
            plusWidth,
          );
        }
      }
    });

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
