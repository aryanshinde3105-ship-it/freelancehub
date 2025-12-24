import { render, screen } from '@testing-library/react';
import App from './App';

test('renders FreelanceHub welcome message', () => {
  render(<App />);
  const heading = screen.getByText(/welcome to freelancehub/i);
  expect(heading).toBeInTheDocument();
});
