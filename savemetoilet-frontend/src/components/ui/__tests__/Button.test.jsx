/**
 * Unit tests for Button component
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Button from '../Button'

describe('Button Component', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>)
    
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('should render button with icon', () => {
    const TestIcon = () => <span data-testid="test-icon">🏠</span>
    render(<Button icon={<TestIcon />}>Home</Button>)
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    expect(screen.getByText('Home')).toBeInTheDocument()
  })

  it('should handle click events', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('opacity-50')
  })

  it('should show loading state', () => {
    render(<Button loading>Loading Button</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    
    // Check for loading spinner
    const spinner = button.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('should not trigger click when loading', () => {
    const handleClick = vi.fn()
    render(<Button loading onClick={handleClick}>Loading Button</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  describe('variants', () => {
    it('should apply primary variant styles by default', () => {
      render(<Button>Primary</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-blue-600')
    })

    it('should apply secondary variant styles', () => {
      render(<Button variant="secondary">Secondary</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-white', 'border-gray-300')
    })

    it('should apply outline variant styles', () => {
      render(<Button variant="outline">Outline</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('border-blue-600', 'text-blue-600')
    })

    it('should apply ghost variant styles', () => {
      render(<Button variant="ghost">Ghost</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('text-gray-600')
    })

    it('should apply danger variant styles', () => {
      render(<Button variant="danger">Danger</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-red-600')
    })

    it('should apply success variant styles', () => {
      render(<Button variant="success">Success</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-green-600')
    })

    it('should apply warning variant styles', () => {
      render(<Button variant="warning">Warning</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-yellow-500')
    })
  })

  describe('sizes', () => {
    it('should apply small size styles', () => {
      render(<Button size="sm">Small</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-3', 'py-2', 'text-sm')
    })

    it('should apply medium size styles by default', () => {
      render(<Button>Medium</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-4', 'py-3', 'text-base')
    })

    it('should apply large size styles', () => {
      render(<Button size="lg">Large</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-6', 'py-4', 'text-lg')
    })

    it('should apply extra small size styles', () => {
      render(<Button size="xs">Extra Small</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-2', 'py-1', 'text-xs')
    })

    it('should apply extra large size styles', () => {
      render(<Button size="xl">Extra Large</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-8', 'py-5', 'text-xl')
    })
  })

  describe('fullWidth prop', () => {
    it('should apply full width styles when fullWidth is true', () => {
      render(<Button fullWidth>Full Width</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('w-full')
    })

    it('should not apply full width styles when fullWidth is false', () => {
      render(<Button fullWidth={false}>Not Full Width</Button>)
      
      const button = screen.getByRole('button')
      expect(button).not.toHaveClass('w-full')
    })
  })

  describe('custom className', () => {
    it('should apply custom className', () => {
      render(<Button className="custom-class">Custom</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })
  })

  describe('accessibility', () => {
    it('should have proper focus styles', () => {
      render(<Button>Focusable</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2')
    })

    it('should support custom attributes', () => {
      render(
        <Button 
          aria-label="Custom label"
          data-testid="custom-button"
          type="submit"
        >
          Custom Button
        </Button>
      )
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Custom label')
      expect(button).toHaveAttribute('data-testid', 'custom-button')
      expect(button).toHaveAttribute('type', 'submit')
    })
  })

  describe('loading with different variants and sizes', () => {
    it('should show loading state with different variants', () => {
      const variants = ['primary', 'secondary', 'outline', 'ghost', 'danger', 'success', 'warning']
      
      variants.forEach(variant => {
        const { unmount } = render(<Button variant={variant} loading>Loading</Button>)
        
        const button = screen.getByRole('button')
        const spinner = button.querySelector('.animate-spin')
        expect(spinner).toBeInTheDocument()
        
        unmount()
      })
    })

    it('should show loading state with different sizes', () => {
      const sizes = ['xs', 'sm', 'md', 'lg', 'xl']
      
      sizes.forEach(size => {
        const { unmount } = render(<Button size={size} loading>Loading</Button>)
        
        const button = screen.getByRole('button')
        const spinner = button.querySelector('.animate-spin')
        expect(spinner).toBeInTheDocument()
        
        unmount()
      })
    })
  })

  describe('edge cases', () => {
    it('should handle button with only icon', () => {
      const TestIcon = () => <span data-testid="only-icon">🏠</span>
      render(<Button icon={<TestIcon />} />)
      
      expect(screen.getByTestId('only-icon')).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should handle empty children', () => {
      render(<Button>{null}</Button>)
      
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should handle multiple children elements', () => {
      render(
        <Button>
          <span>First</span>
          <span>Second</span>
        </Button>
      )
      
      expect(screen.getByText('First')).toBeInTheDocument()
      expect(screen.getByText('Second')).toBeInTheDocument()
    })
  })
})