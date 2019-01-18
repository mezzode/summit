import React, { Component } from 'react';

type Plus = {
  plusLength: number;
  plusWidth: number;
} | null;

interface Props {
  className: string;
  imgs: HTMLImageElement[];
  margin: number;
  plus: Plus;
  spacing: number;
  onUrlChange(canvasUrl: string | null): void;
}

interface State {
  canvasUrl: string | null;
}

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

  return a.plusLength !== b.plusLength || a.plusWidth !== b.plusWidth;
};

const calcPositions = (
  imgs: HTMLImageElement[],
  spacing: number,
  margin: number,
) => {
  const verticalWhitespace = 2; // Top and bottom
  const maxHeight = Math.max(...imgs.map(({ height }) => height));
  const fullHeight = maxHeight + margin * verticalWhitespace;

  let x = margin;

  // Calc positions (for drawing later since resizing the canvas clears it)
  const positions = [];
  for (const img of imgs) {
    const y = (fullHeight - img.height) / verticalWhitespace;
    positions.push({ img, x, y });
    x += img.width + spacing;
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
  const halfFactor = 2;
  const halfLength = sideLength / halfFactor;
  ctx.beginPath();
  ctx.lineWidth = lineWidth;
  ctx.moveTo(x - halfLength, y);
  ctx.lineTo(x + halfLength, y);
  ctx.moveTo(x, y - halfLength);
  ctx.lineTo(x, y + halfLength);
  ctx.stroke();
};

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
      plusDiffer(prevProps.plus, this.props.plus)
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
    return (
      this.props.imgs.length > 0 && (
        <canvas ref={this.canvas} className={this.props.className} />
      )
    );
  }

  private updateCanvas(): void {
    // Clear old url
    this.setState({ canvasUrl: null });
    const { margin, spacing, plus } = this.props;

    const { positions, fullHeight, fullWidth } = calcPositions(
      this.props.imgs,
      spacing,
      margin,
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

    positions.forEach(({ img, x, y }, index) => {
      ctx.drawImage(img, x, y);

      if (plus) {
        // Draw pluses between images
        const { plusLength, plusWidth } = plus;
        const halfFactor = 2;
        if (index + 1 !== positions.length) {
          drawPlus(
            ctx,
            x + img.width + spacing / halfFactor,
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
