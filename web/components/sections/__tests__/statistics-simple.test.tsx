import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Simple test component to verify our setup
const TestComponent = () => {
    return (
        <div>
            <h1>Server Statistics</h1>
            <p>Loading statistics...</p>
            <div>150</div>
            <div>75</div>
            <div>Total Players</div>
            <div>Online Players</div>
        </div>
    );
};

describe('Statistics Component Simple Test', () => {
    it('should render basic statistics elements', () => {
        render(<TestComponent />);

        expect(screen.getByText('Server Statistics')).toBeInTheDocument();
        expect(screen.getByText('Loading statistics...')).toBeInTheDocument();
        expect(screen.getByText('150')).toBeInTheDocument();
        expect(screen.getByText('75')).toBeInTheDocument();
        expect(screen.getByText('Total Players')).toBeInTheDocument();
        expect(screen.getByText('Online Players')).toBeInTheDocument();
    });

    it('should handle multiple values', () => {
        render(<TestComponent />);

        const elements = screen.getAllByText(/\d+/);
        expect(elements).toHaveLength(2); // Should find 150 and 75
    });
});
