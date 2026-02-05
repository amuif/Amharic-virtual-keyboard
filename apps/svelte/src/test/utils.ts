import userEvent from '@testing-library/user-event';

// Mock user event setup
export function setupUserEvent() {
    return userEvent.setup();
}

// Wait for promises to resolve
export function wait(ms = 0) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
