# Modern Quiz Application Design System

## Overview
This design system provides a comprehensive foundation for redesigning the quiz application with a modern, appealing, and fully responsive interface. The system focuses on simplicity, accessibility, and mobile-first design principles.

## Color Palette

### Primary Colors
- **Primary Blue**: `#3B82F6` (Blue-500)
- **Primary Dark**: `#2563EB` (Blue-600)
- **Primary Light**: `#60A5FA` (Blue-400)
- **Primary Background**: `#EFF6FF` (Blue-50)

### Secondary Colors
- **Secondary Purple**: `#8B5CF6` (Purple-500)
- **Secondary Dark**: `#7C3AED` (Purple-600)
- **Secondary Light**: `#A78BFA` (Purple-400)

### Success Colors
- **Success Green**: `#10B981` (Green-500)
- **Success Dark**: `#059669` (Green-600)
- **Success Light**: `#34D399` (Green-400)
- **Success Background**: `#ECFDF5` (Green-50)

### Warning Colors
- **Warning Amber**: `#F59E0B` (Amber-500)
- **Warning Dark**: `#D97706` (Amber-600)
- **Warning Light**: `#FCD34D` (Amber-400)
- **Warning Background**: `#FFFBEB` (Amber-50)

### Error Colors
- **Error Red**: `#EF4444` (Red-500)
- **Error Dark**: `#DC2626` (Red-600)
- **Error Light**: `#F87171` (Red-400)
- **Error Background**: `#FEF2F2` (Red-50)

### Neutral Colors
- **Gray-50**: `#F9FAFB` (Background)
- **Gray-100**: `#F3F4F6` (Light Background)
- **Gray-200**: `#E5E7EB` (Borders)
- **Gray-300**: `#D1D5DB` (Disabled)
- **Gray-400**: `#9CA3AF` (Placeholder)
- **Gray-500**: `#6B7280` (Secondary Text)
- **Gray-600**: `#4B5563` (Text)
- **Gray-700**: `#374151` (Heading)
- **Gray-800**: `#1F2937` (Dark Text)
- **Gray-900**: `#111827` (Primary Text)

## Typography

### Font Family
- **Primary**: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif
- **Monospace**: 'Fira Code', 'Monaco', 'Cascadia Code', 'Segoe UI Mono', 'Roboto Mono', 'Oxygen Mono', 'Ubuntu Monospace', 'Source Code Pro', 'Fira Mono', 'Droid Sans Mono', 'Courier New', monospace

### Font Sizes
- **xs**: `0.75rem` (12px)
- **sm**: `0.875rem` (14px)
- **base**: `1rem` (16px)
- **lg**: `1.125rem` (18px)
- **xl**: `1.25rem` (20px)
- **2xl**: `1.5rem` (24px)
- **3xl**: `1.875rem` (30px)
- **4xl**: `2.25rem` (36px)
- **5xl**: `3rem` (48px)

### Font Weights
- **light**: `300`
- **normal**: `400`
- **medium**: `500`
- **semibold**: `600`
- **bold**: `700`
- **extrabold**: `800`

### Line Heights
- **tight**: `1.25`
- **snug**: `1.375`
- **normal**: `1.5`
- **relaxed**: `1.625`
- **loose**: `2`

## Spacing System

### Base Spacing (4px scale)
- **0**: `0px`
- **1**: `0.25rem` (4px)
- **2**: `0.5rem` (8px)
- **3**: `0.75rem` (12px)
- **4**: `1rem` (16px)
- **5**: `1.25rem` (20px)
- **6**: `1.5rem` (24px)
- **8**: `2rem` (32px)
- **10**: `2.5rem` (40px)
- **12**: `3rem` (48px)
- **16**: `4rem` (64px)
- **20**: `5rem` (80px)
- **24**: `6rem` (96px)

## Border Radius

- **none**: `0px`
- **sm**: `0.125rem` (2px)
- **base**: `0.25rem` (4px)
- **md**: `0.375rem` (6px)
- **lg**: `0.5rem` (8px)
- **xl**: `0.75rem` (12px)
- **2xl**: `1rem` (16px)
- **3xl**: `1.5rem` (24px)
- **full**: `9999px`

## Shadows

- **sm**: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
- **base**: `0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)`
- **md**: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)`
- **lg**: `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)`
- **xl**: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)`
- **2xl**: `0 25px 50px -12px rgba(0, 0, 0, 0.25)`

## Component Design Patterns

### Buttons

#### Primary Button
```css
.btn-primary {
  background-color: #3B82F6;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.btn-primary:hover {
  background-color: #2563EB;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.btn-primary:active {
  transform: translateY(1px);
}
```

#### Secondary Button
```css
.btn-secondary {
  background-color: white;
  color: #374151;
  border: 1px solid #D1D5DB;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background-color: #F9FAFB;
  border-color: #9CA3AF;
}
```

#### Ghost Button
```css
.btn-ghost {
  background-color: transparent;
  color: #3B82F6;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.btn-ghost:hover {
  background-color: #EFF6FF;
}
```

### Cards

#### Base Card
```css
.card {
  background-color: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  padding: 1.5rem;
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}
```

#### Interactive Card
```css
.card-interactive {
  background-color: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.card-interactive:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
  border-color: #3B82F6;
}

.card-interactive:active {
  transform: translateY(0);
}
```

### Form Elements

#### Input Fields
```css
.input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #D1D5DB;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  background-color: white;
}

.input:focus {
  outline: none;
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input::placeholder {
  color: #9CA3AF;
}
```

#### Textarea
```css
.textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #D1D5DB;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  background-color: white;
  resize: vertical;
  min-height: 100px;
}

.textarea:focus {
  outline: none;
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
```

#### Select Dropdown
```css
.select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #D1D5DB;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  background-color: white;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
}

.select:focus {
  outline: none;
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
```

### Badges

#### Default Badge
```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}
```

#### Color Variants
```css
.badge-blue {
  background-color: #EFF6FF;
  color: #1D4ED8;
}

.badge-green {
  background-color: #ECFDF5;
  color: #047857;
}

.badge-purple {
  background-color: #F3E8FF;
  color: #7C3AED;
}

.badge-gray {
  background-color: #F3F4F6;
  color: #374151;
}
```

## Layout Guidelines

### Container
```css
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

@media (min-width: 640px) {
  .container {
    padding: 0 2rem;
  }
}
```

### Grid System
```css
.grid {
  display: grid;
  gap: 1.5rem;
}

.grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }

@media (min-width: 640px) {
  .sm\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .sm\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (min-width: 768px) {
  .md\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .md\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .md\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}

@media (min-width: 1024px) {
  .lg\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .lg\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
```

## Animation Guidelines

### Transitions
```css
.transition {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.transition-slow {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}
```

### Keyframe Animations
```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

## Responsive Breakpoints

```css
/* Mobile First Approach */
/* Small (sm): 640px and up */
@media (min-width: 640px) {
  .sm\:block { display: block; }
  .sm\:hidden { display: none; }
}

/* Medium (md): 768px and up */
@media (min-width: 768px) {
  .md\:block { display: block; }
  .md\:hidden { display: none; }
}

/* Large (lg): 1024px and up */
@media (min-width: 1024px) {
  .lg\:block { display: block; }
  .lg\:hidden { display: none; }
}

/* Extra Large (xl): 1280px and up */
@media (min-width: 1280px) {
  .xl\:block { display: block; }
  .xl\:hidden { display: none; }
}

/* 2XL (2xl): 1536px and up */
@media (min-width: 1536px) {
  .2xl\:block { display: block; }
  .2xl\:hidden { display: none; }
}
```

## Accessibility Guidelines

### Focus States
```css
.focus-ring {
  outline: 2px solid transparent;
  outline-offset: 2px;
}

.focus-ring:focus {
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
}
```

### Screen Reader Only
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  .transition {
    transition: none;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
}
```

## Dark Mode Support

### Dark Color Palette
```css
.dark {
  --color-background: #111827;
  --color-surface: #1F2937;
  --color-text: #F9FAFB;
  --color-text-secondary: #D1D5DB;
  --color-border: #374151;
}
```

### Dark Mode Components
```css
.dark .card {
  background-color: var(--color-surface);
  border-color: var(--color-border);
}

.dark .input {
  background-color: var(--color-surface);
  border-color: var(--color-border);
  color: var(--color-text);
}

.dark .btn-secondary {
  background-color: var(--color-surface);
  color: var(--color-text);
  border-color: var(--color-border);
}