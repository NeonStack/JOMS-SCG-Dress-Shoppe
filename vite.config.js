import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	// server: {
	// 	host: '192.168.1.7',
	// 	port: 5173, 
	//   }
});
