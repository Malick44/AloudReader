import { ModelCatalogEntry } from './types';

export const localModelCatalog: ModelCatalogEntry[] = [
  {
    id: 'en-us-amy',
    family: 'piper',
    language: 'en-US',
    displayName: 'Amy (Piper)',
    artifactUrls: {
      'en_US-amy-low.onnx':
        'https://huggingface.co/csukuangfj/vits-piper-en_US-amy-low/resolve/main/en_US-amy-low.onnx?download=true',
      'tokens.txt':
        'https://huggingface.co/csukuangfj/vits-piper-en_US-amy-low/resolve/main/tokens.txt?download=true',
    },
    artifactChecksumsSha256: {
      'en_US-amy-low.onnx': '8275b02c37c4ce6483b26a91704807e6de0c3f0bf8068e5d3b3598ab0da4253e',
      'tokens.txt': '42d1a69ed2b91a51928a711aa228ed9f3dc021c6d359a3e9c4f37eb1d20f80bd',
    },
  },
  {
    id: 'en-us-amy-medium',
    family: 'piper',
    language: 'en-US',
    displayName: 'Amy Medium (Piper)',
    artifactUrls: {
      'en_US-amy-medium.onnx':
        'https://huggingface.co/csukuangfj/vits-piper-en_US-amy-medium/resolve/main/en_US-amy-medium.onnx?download=true',
      'tokens.txt':
        'https://huggingface.co/csukuangfj/vits-piper-en_US-amy-medium/resolve/main/tokens.txt?download=true',
    },
    artifactChecksumsSha256: {
      'en_US-amy-medium.onnx': 'fbaa8e36d8f26fe6f3ebb65cab461e629d8b37a5b7c5fb78fb64317db73e1c25',
      'tokens.txt': '87c8ef66eae5473ed0cc0366b3964c736ca6c5f676c979522ea31234e47430b9',
    },
  },
  {
    id: 'en-us-ryan',
    family: 'piper',
    language: 'en-US',
    displayName: 'Ryan (Piper)',
    artifactUrls: {
      'en_US-ryan-high.onnx':
        'https://huggingface.co/csukuangfj/vits-piper-en_US-ryan-high/resolve/main/en_US-ryan-high.onnx?download=true',
      'tokens.txt':
        'https://huggingface.co/csukuangfj/vits-piper-en_US-ryan-high/resolve/main/tokens.txt?download=true',
    },
    artifactChecksumsSha256: {
      'en_US-ryan-high.onnx': '4343c10fd88301574d2012b3d006fa5fc8fdf18d04ca9564ef399eed180d8788',
      'tokens.txt': '42d1a69ed2b91a51928a711aa228ed9f3dc021c6d359a3e9c4f37eb1d20f80bd',
    },
  },
  {
    id: 'en-us-lessac-high',
    family: 'piper',
    language: 'en-US',
    displayName: 'Lessac High (Piper)',
    artifactUrls: {
      'en_US-lessac-high.onnx':
        'https://huggingface.co/csukuangfj/vits-piper-en_US-lessac-high/resolve/main/en_US-lessac-high.onnx?download=true',
      'tokens.txt':
        'https://huggingface.co/csukuangfj/vits-piper-en_US-lessac-high/resolve/main/tokens.txt?download=true',
    },
    artifactChecksumsSha256: {
      'en_US-lessac-high.onnx':
        '1315b0b3746e9ff52f8ccc88d3d9eaa6c289001fc58951ed88c0fb3a0befe635',
      'tokens.txt': '87c8ef66eae5473ed0cc0366b3964c736ca6c5f676c979522ea31234e47430b9',
    },
  },
  {
    id: 'en-uk-sonia',
    family: 'kokoro',
    language: 'en-GB',
    displayName: 'Sonia (Kokoro)',
  },
];

export function getCatalogModel(modelId: string): ModelCatalogEntry | undefined {
  return localModelCatalog.find((entry) => entry.id === modelId);
}
