import { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 64 80" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
            {/* Crown */}
            <path d="M22 8L26 2L32 6L38 2L42 8L40 10H24L22 8Z" />
            <circle cx="26" cy="2" r="2" />
            <circle cx="32" cy="4" r="2" />
            <circle cx="38" cy="2" r="2" />
            
            {/* Shield outline */}
            <path
                d="M32 12C20 12 10 14 10 14V42C10 56 32 72 32 72C32 72 54 56 54 42V14C54 14 44 12 32 12Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
            />
            
            {/* Inner shield accent */}
            <path
                d="M32 20C24 20 18 21 18 21V40C18 50 32 62 32 62C32 62 46 50 46 40V21C46 21 40 20 32 20Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
            />
            
            {/* Server/Database box */}
            <rect x="22" y="26" width="20" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <rect x="22" y="34" width="20" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
            
            {/* Server indicator dots */}
            <circle cx="38" cy="29" r="1" fill="#f97316" />
            <circle cx="35" cy="29" r="1" fill="#f97316" />
            <circle cx="38" cy="37" r="1" fill="#f97316" />
            <circle cx="35" cy="37" r="1" fill="#f97316" />
            
            {/* Server lines */}
            <line x1="24" y1="29" x2="31" y2="29" stroke="currentColor" strokeWidth="1" />
            <line x1="24" y1="37" x2="31" y2="37" stroke="currentColor" strokeWidth="1" />
            
            {/* Cloud with upload arrow */}
            <path
                d="M30 52C27 52 25 50 25 48C25 46 27 44 30 44C30 42 32 40 35 40C38 40 40 42 40 45C42 45 43 47 43 49C43 51 41 52 39 52H30Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
            />
            
            {/* Upload arrow */}
            <path d="M35 51V46M33 48L35 45L37 48" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
