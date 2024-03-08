import { useEffect, useRef } from 'react';

interface ThumbnailRendererProps {
    height: number;
    width: number;
    buffer: ArrayBuffer;
}

const ThumbnailRenderer = (props: ThumbnailRendererProps) => {
    const { width, height, buffer } = props;
    const thumbnailRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (thumbnailRef.current) {
            thumbnailRef.current.width = width;
            thumbnailRef.current.height = height;
        }
    }, [height, width]);

    useEffect(() => {
        if (thumbnailRef.current) {
            const ctx = thumbnailRef.current.getContext('2d');
            ctx?.clearRect(0, 0, thumbnailRef.current.width, thumbnailRef.current.height);
            const array = new Uint8ClampedArray(buffer);
            const image = new ImageData(array, width, height);
            ctx?.putImageData(image, 0, 0);
        }
    }, [buffer, width, height]);

    if (width === 0 || height === 0) return null;

    return <canvas ref={thumbnailRef}></canvas>
}

export default ThumbnailRenderer;
