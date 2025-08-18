# This file is only for editing file nodes, do not break the structure
## Project Description
Enterprise Intelligence Graph (EIG) platform - A professional banking application that constructs a 360° view of enterprise clients and potential clients by integrating multi-source heterogeneous data, mapping relationships between enterprises, and providing intelligent marketing insights based on graph analysis.

## Key Features
- Multi-dimensional enterprise value assessment (SVS, DES, NIS, PCS scores)
- Interactive graph visualization of enterprise relationships
- "Warm introduction" path discovery for effective marketing
- Intelligent potential client discovery engine
- Human-machine collaborative data review system

## Devv SDK Integration
Built-in: auth (OTP), table (users, enterprises, relationships, people, events, tasks), DevvAI (marketing insights), email (notifications)
External: N/A

/src
├── assets/          # Static resources directory, storing static files like images and fonts
│
├── components/      # Components directory
│   ├── ui/         # Pre-installed shadcn/ui components, avoid modifying or rewriting unless necessary
│
├── hooks/          # Custom Hooks directory
│   ├── use-mobile.ts # Pre-installed mobile detection Hook from shadcn (import { useIsMobile } from '@/hooks/use-mobile')
│   └── use-toast.ts  # Toast notification system hook for displaying toast messages (import { useToast } from '@/hooks/use-toast')
│
├── lib/            # Utility library directory
│   └── utils.ts    # Utility functions, including the cn function for merging Tailwind class names
│
├── pages/          # Page components directory, based on React Router structure
│   ├── HomePage.tsx # Home page component, serving as the main entry point of the application
│   └── NotFoundPage.tsx # 404 error page component, displays when users access non-existent routes
│
├── App.tsx         # Root component, with React Router routing system configured
│                   # Add new route configurations in this file
│                   # Includes catch-all route (*) for 404 page handling
│
├── main.tsx        # Entry file, rendering the root component and mounting to the DOM
│
├── index.css       # Global styles file, containing Tailwind configuration and custom styles
│                   # Modify theme colors and design system variables in this file
│
└── tailwind.config.js  # Tailwind CSS v3 configuration file
# Contains theme customization, plugins, and content paths
# Includes shadcn/ui theme configuration