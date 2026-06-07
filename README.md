# OPM-Pro

OPM-Pro is a web-based modeling platform for Object-Process Methodology (OPM) following the ISO 19450 standard, implemented with React, Vite, Tailwind CSS, and Konva.

This repository contains the source code for the application. Below are instructions detailing how to prepare your local development environment, install dependencies, run the server, and compile builds for production deployment.

---

## Environment Preparation

To run this application, ensure your workstation meets the following runtime requirements:

1. **Node.js**: Standard active LTS release or higher (v18.x, v20.x, or v22.x recommended).
2. **npm**: Included package manager (v9.x or higher).

---

## Installation and Setup

1. **Clone or Download the Codebase**  
   Download or clone this project repository into a directory on your local machine.

2. **Install Package Dependencies**  
   From your terminal, navigate to the project directory root and execute the standard installer to download and configure all dependencies:
   ```bash
   npm install
   ```

---

## Development Workflow

### Running the Live Development Server

To boot the local development server with Hot Module Replacement (HMR) and real-time asset hosting:
```bash
npm run dev
```

Once running, the development console will indicate the local URL where you can view your active app. By default, this is:
```
http://localhost:3000
```

### Static Analysis and Code Linting

To validate codebase integrity, syntax structures, and TypeScript type constraints, run the integrated linter:
```bash
npm run lint
```

---

## Production Compilation & Building

### Generate Static Production Bundle

To build a minimized, performance-optimized static distribution suitable for deployment to web servers (e.g., Cloud Run, Nginx, Netlify, Vercel):
```bash
npm run build
```

This compiles TypeScript, optimizes images, minifies styling rules via Tailwind CSS, and outputs static HTML, CSS, and JS assets to the local directory:
```
/dist
```

### Previewing the Production Build

To serve the generated optimized files locally as they would behave in a production environment:
```bash
npm run preview
```

---

## License

This project is open-source and licensed under the standard **BSD 3-Clause License** - see the [LICENSE](LICENSE) file for further legal definitions.

### Credits
Developed and contributed by **Avi Shaked**.
