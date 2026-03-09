import { createPipelinePlaybackController } from './pipeline';
import { TrackPlayerEvent, isTrackPlayerAvailable, seekTrackPlayerTo } from './trackPlayer';

export async function PlaybackService() {
  if (!isTrackPlayerAvailable()) {
    return;
  }

  const controller = createPipelinePlaybackController();

  const { addTrackPlayerListener } = await import('./trackPlayer');

  addTrackPlayerListener(TrackPlayerEvent.RemotePlay, () => {
    controller.resume();
  });

  addTrackPlayerListener(TrackPlayerEvent.RemotePause, () => {
    controller.pause();
  });

  addTrackPlayerListener(TrackPlayerEvent.RemoteStop, async () => {
    await controller.stop();
  });

  addTrackPlayerListener(TrackPlayerEvent.RemoteNext, async () => {
    await controller.skipChunk();
  });

  addTrackPlayerListener(TrackPlayerEvent.RemotePrevious, async () => {
    await controller.rewindChunk();
  });

  addTrackPlayerListener(TrackPlayerEvent.RemoteSeek, async (event) => {
    const position = typeof event?.position === 'number' ? event.position : 0;
    await seekTrackPlayerTo(position);
  });
}
