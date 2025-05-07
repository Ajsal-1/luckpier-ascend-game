
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				luckpier: {
					navy: {
						DEFAULT: '#000066',  // Deep navy blue
						light: '#0000AA',
						dark: '#000033',
					},
					gold: {
						DEFAULT: '#FFD700', // Gold
						light: '#FFEC8B',
						dark: '#DAA520',
					},
					dark: '#000033',
					light: '#F7F7F7',
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'multiplier-grow': {
					'0%': { transform: 'scale(0.98)', opacity: '0.8' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				},
				'pulse-win': {
					'0%, 100%': { transform: 'scale(1)' },
					'50%': { transform: 'scale(1.1)' }
				},
				'fade-in': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				'slide-up': {
					'0%': { transform: 'translateY(10px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				'slide-in-right': {
					'0%': { transform: 'translateX(100%)', opacity: '0' },
					'100%': { transform: 'translateX(0)', opacity: '1' }
				},
				'sparkle': {
					'0%, 100%': { opacity: '0' },
					'50%': { opacity: '1' }
				},
				'gold-pulse': {
					'0%, 100%': { boxShadow: '0 0 5px rgba(255, 215, 0, 0.5)' },
					'50%': { boxShadow: '0 0 20px rgba(255, 215, 0, 0.8)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'multiplier-grow': 'multiplier-grow 0.5s ease-out infinite alternate',
				'pulse-win': 'pulse-win 0.5s ease-in-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'slide-up': 'slide-up 0.3s ease-out',
				'slide-in-right': 'slide-in-right 0.3s ease-out',
				'sparkle': 'sparkle 1.5s ease-in-out infinite',
				'gold-pulse': 'gold-pulse 2s infinite'
			},
			backgroundImage: {
				'gradient-blue': 'linear-gradient(90deg, rgba(15,160,206,1) 0%, rgba(30,174,219,1) 100%)',
				'gradient-gold': 'linear-gradient(90deg, rgba(218,165,32,1) 0%, rgba(255,215,0,1) 100%)',
				'gradient-navy': 'linear-gradient(90deg, rgba(0,0,51,1) 0%, rgba(0,0,102,1) 100%)',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
