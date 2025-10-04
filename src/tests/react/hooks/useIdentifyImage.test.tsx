import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { useIdentifyImage } from '@/react/hooks/useIdentifyImage';
import { IdentifyImage } from '@/Tasks/IdentifyImage';

jest.mock('@/Tasks/IdentifyImage');

const MockedIdentifyImage = IdentifyImage as jest.MockedClass<typeof IdentifyImage>;

type IdentifyImageReturn = Awaited<ReturnType<IdentifyImage['run']>>;

const POINT = { lng: -120, lat: 35 };

const createMockIdentifyImage = (overrides: Partial<IdentifyImage> = {}) => {
  const at = jest.fn().mockReturnThis();
  const run = jest.fn().mockResolvedValue({ results: [] });

  return {
    at,
    run,
    ...overrides,
  } as unknown as IdentifyImage;
};

const TestComponent: React.FC<{
  onResult?: (result: IdentifyImageReturn | null) => void;
}> = ({ onResult }) => {
  const { identifyImage, loading, error } = useIdentifyImage({ url: 'https://example.com' });

  const handleRun = async () => {
    try {
      const result = await identifyImage(POINT);
      onResult?.(result);
    } catch {
      onResult?.(null);
    }
  };

  return (
    <div>
      <button data-testid="run" onClick={handleRun}>
        Run
      </button>
      <span data-testid="loading">{loading ? 'true' : 'false'}</span>
      <span data-testid="error">{error?.message ?? 'null'}</span>
    </div>
  );
};

describe('useIdentifyImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('executes identify image task and returns results', async () => {
    const result: IdentifyImageReturn = {
      results: [{ value: '42' }],
      location: { x: -120, y: 35 },
    };

    const mockInstance = createMockIdentifyImage({
      run: jest.fn().mockResolvedValue(result),
    });
    MockedIdentifyImage.mockImplementation(() => mockInstance);

    const onResult = jest.fn();
    const { getByTestId } = render(<TestComponent onResult={onResult} />);

    await act(async () => {
      getByTestId('run').click();
    });

    await waitFor(() => {
      expect(onResult).toHaveBeenCalledWith(result);
    });

    expect(mockInstance.at).toHaveBeenCalledWith(POINT);
    expect(mockInstance.run).toHaveBeenCalled();
  });

  it('sets error state when identify image fails', async () => {
    const error = new Error('Identify failed');
    const mockInstance = createMockIdentifyImage({
      run: jest.fn().mockRejectedValue(error),
    });
    MockedIdentifyImage.mockImplementation(() => mockInstance);

    const { getByTestId } = render(<TestComponent />);

    await act(async () => {
      getByTestId('run').click();
    });

    await waitFor(() => {
      expect(getByTestId('error').textContent).toBe('Identify failed');
    });
  });
});
