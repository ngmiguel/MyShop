import { Injectable, NgZone, OnDestroy } from '@angular/core';
import jsQR from 'jsqr';

@Injectable({ providedIn: 'root' })
export class QrScannerService implements OnDestroy {
  private stream?: MediaStream;
  private rafId?: number;
  private lastValue = '';
  private lastAt = 0;
  private onResult?: (value: string) => void;

  constructor(private readonly zone: NgZone) {}

  ngOnDestroy(): void {
    this.stop();
  }

  async start(
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    onResult: (value: string) => void,
  ): Promise<void> {
    this.stop();
    this.onResult = onResult;
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false,
    });
    video.srcObject = this.stream;
    await video.play();
    this.scanLoop(video, canvas);
  }

  stop(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = undefined;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = undefined;
    this.onResult = undefined;
    this.lastValue = '';
    this.lastAt = 0;
  }

  isRunning(): boolean {
    return !!this.stream;
  }

  private scanLoop(video: HTMLVideoElement, canvas: HTMLCanvasElement): void {
    const tick = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(image.data, image.width, image.height, { inversionAttempts: 'dontInvert' });
          if (code?.data) {
            const now = Date.now();
            if (code.data !== this.lastValue || now - this.lastAt > 2500) {
              this.lastValue = code.data;
              this.lastAt = now;
              this.zone.run(() => this.onResult?.(code.data));
            }
          }
        }
      }
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }
}
