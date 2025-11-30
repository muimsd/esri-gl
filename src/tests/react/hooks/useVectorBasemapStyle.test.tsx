import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { useVectorBasemapStyle } from '@/react/hooks/useVectorBasemapStyle';
import { VectorBasemapStyle } from '@/Services/VectorBasemapStyle';

// Mock the VectorBasemapStyle class
jest.mock('@/Services/VectorBasemapStyle');

const MockedVectorBasemapStyle = VectorBasemapStyle as jest.MockedClass<typeof VectorBasemapStyle>;

// Test component that uses the hook
const TestComponent: React.FC<{
  basemapEnum?: string;
  credentialType?: 'token' | 'apiKey' | 'none';
  credentialValue?: string;
  language?: string;
  worldview?: string;
}> = ({
  basemapEnum = 'arcgis/streets',
  credentialType = 'token',
  credentialValue = 'test-token',
  language,
  worldview,
}) => {
  const options =
    credentialType === 'none'
      ? undefined
      : {
          basemapEnum,
          token: credentialType === 'token' ? credentialValue : undefined,
          apiKey: credentialType === 'apiKey' ? credentialValue : undefined,
          language,
          worldview,
        };

  const { service, loading, error, reload } = useVectorBasemapStyle({
    options,
  });

  return (
    <div>
      <span data-testid="loading">{loading.toString()}</span>
      <span data-testid="error">{error?.message || 'null'}</span>
      <span data-testid="service-exists">{service ? 'true' : 'false'}</span>
      <button data-testid="reload" onClick={reload}>
        Reload
      </button>
    </div>
  );
};

describe('useVectorBasemapStyle', () => {
  let mockServiceInstance: jest.Mocked<VectorBasemapStyle>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a mock service instance
    mockServiceInstance = {
      styleName: 'arcgis/streets',
      styleUrl: 'https://example.com/style.json',
      setStyle: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as any;

    // Mock the constructor to return our mock instance
    MockedVectorBasemapStyle.mockImplementation(() => mockServiceInstance);
  });

  it('should create service instance with default options', async () => {
    render(<TestComponent />);

    await waitFor(() => {
      expect(MockedVectorBasemapStyle).toHaveBeenCalledWith('arcgis/streets', {
        token: 'test-token',
        apiKey: undefined,
        language: undefined,
        worldview: undefined,
      });
    });
  });

  it('should handle service creation errors', async () => {
    const mockError = new Error('Service creation failed');
    MockedVectorBasemapStyle.mockImplementation(() => {
      throw mockError;
    });

    const { getByTestId } = render(<TestComponent />);

    await waitFor(() => {
      expect(getByTestId('error').textContent).toBe('Service creation failed');
    });
  });

  it('should set loading state correctly', async () => {
    const { getByTestId } = render(<TestComponent />);

    await waitFor(() => {
      expect(getByTestId('loading').textContent).toBe('false');
    });
  });

  it('should recreate service when basemapEnum changes', async () => {
    jest.clearAllMocks(); // Clear previous test calls

    const { rerender } = render(<TestComponent basemapEnum="arcgis/streets" />);

    await waitFor(() => {
      expect(MockedVectorBasemapStyle).toHaveBeenCalledWith('arcgis/streets', {
        token: 'test-token',
        apiKey: undefined,
        language: undefined,
        worldview: undefined,
      });
    });

    const callsAfterFirst = MockedVectorBasemapStyle.mock.calls.length;

    // Change basemap enum
    rerender(<TestComponent basemapEnum="arcgis/topographic" />);

    await waitFor(() => {
      expect(MockedVectorBasemapStyle).toHaveBeenCalledWith('arcgis/topographic', {
        token: 'test-token',
        apiKey: undefined,
        language: undefined,
        worldview: undefined,
      });
    });

    // Should have more calls after the rerender
    expect(MockedVectorBasemapStyle.mock.calls.length).toBeGreaterThan(callsAfterFirst);
  });

  it('should recreate service when token changes', async () => {
    jest.clearAllMocks(); // Clear previous test calls

    const { rerender } = render(<TestComponent credentialType="token" credentialValue="token1" />);

    await waitFor(() => {
      expect(MockedVectorBasemapStyle).toHaveBeenCalledWith('arcgis/streets', {
        token: 'token1',
        apiKey: undefined,
        language: undefined,
        worldview: undefined,
      });
    });

    const callsAfterFirst = MockedVectorBasemapStyle.mock.calls.length;

    // Change token
    rerender(<TestComponent credentialType="token" credentialValue="token2" />);

    await waitFor(() => {
      expect(MockedVectorBasemapStyle).toHaveBeenCalledWith('arcgis/streets', {
        token: 'token2',
        apiKey: undefined,
        language: undefined,
        worldview: undefined,
      });
    });

    // Should have more calls after the rerender
    expect(MockedVectorBasemapStyle.mock.calls.length).toBeGreaterThan(callsAfterFirst);
  });

  it('should handle reload functionality', async () => {
    jest.clearAllMocks(); // Clear previous test calls

    const { getByTestId } = render(<TestComponent />);

    await waitFor(() => {
      expect(MockedVectorBasemapStyle).toHaveBeenCalled();
    });

    const callsBeforeReload = MockedVectorBasemapStyle.mock.calls.length;

    // Click reload button
    getByTestId('reload').click();

    await waitFor(() => {
      expect(MockedVectorBasemapStyle.mock.calls.length).toBeGreaterThan(callsBeforeReload);
    });
  });

  it('should cleanup service on unmount', async () => {
    const { unmount } = render(<TestComponent />);

    await waitFor(() => {
      expect(MockedVectorBasemapStyle).toHaveBeenCalled();
    });

    unmount();

    // Cleanup should call remove method
    expect(mockServiceInstance.remove).toHaveBeenCalled();
  });

  it('should handle service creation with all options', async () => {
    const { getByTestId } = render(
      <TestComponent
        basemapEnum="arcgis/topographic"
        credentialType="token"
        credentialValue="my-token"
        language="en"
        worldview="US"
      />
    );

    await waitFor(() => {
      expect(MockedVectorBasemapStyle).toHaveBeenCalledWith('arcgis/topographic', {
        token: 'my-token',
        apiKey: undefined,
        language: 'en',
        worldview: 'US',
      });
    });

    expect(getByTestId('service-exists').textContent).toBe('true');
  });

  it('should create service with apiKey credentials', async () => {
    render(
      <TestComponent
        credentialType="apiKey"
        credentialValue="abc123"
        basemapEnum="arcgis/streets"
      />
    );

    await waitFor(() => {
      expect(MockedVectorBasemapStyle).toHaveBeenCalledWith('arcgis/streets', {
        token: undefined,
        apiKey: 'abc123',
        language: undefined,
        worldview: undefined,
      });
    });
  });

  it('should not create service when credentials are missing', async () => {
    render(<TestComponent credentialType="none" />);

    await waitFor(() => {
      expect(MockedVectorBasemapStyle).not.toHaveBeenCalled();
    });
  });
});
