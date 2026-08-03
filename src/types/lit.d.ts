import type React from 'react'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'hello-form': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >
    }
  }
}

export {}
