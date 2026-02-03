import { mount } from 'svelte';
import App from './ExampleComponent.svelte';

const app = mount(App, {
  target: document.getElementById('app')!
});

export default app;
