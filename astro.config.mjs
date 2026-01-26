// @ts-check

import cloudflare from "@astrojs/cloudflare";
import partytown from "@astrojs/partytown";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, passthroughImageService } from "astro/config";
import robotsTxt from "astro-robots-txt";
import webmanifest from "astro-webmanifest";

import svelte from "@astrojs/svelte";

// https://astro.build/config
export default defineConfig({
    site: "https://torialess.shamscorner.com",
    output: "static",

    image: {
        service: passthroughImageService(),
        domains: [
            "shamscorner.com",
            "www.shamscorner.com",
        ],
    },

    integrations: [
      partytown(),
      sitemap(),
      robotsTxt({
        sitemap: true,
		  }),
      webmanifest({
        name: "Torialess",
        icon: "src/assets/favicon.svg",

        short_name: "Torialess",
        description:
            "‘Torialess’ is a suite of tools designed to help developers create coding tutorials quickly and efficiently. It offers features like svg preview, awesome screenshots, focused todos, and more to streamline the tutorial creation process.",
        start_url: "/",
        theme_color: "#e17100",
        background_color: "#171717",
        display: "standalone",
		  }),
      react(),
      svelte()
    ],

    vite: {
        build: {
            minify: false,
        },
        plugins: [
            // @ts-ignore
            tailwindcss(),
        ],
    },

    adapter: cloudflare({
        imageService: "passthrough",
        platformProxy: {
            enabled: true,
        },
    }),
});
