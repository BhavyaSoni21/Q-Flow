import React from "react";

export default function HeroSvg({ className }) {
    return (
        <svg
            className={className}
            viewBox="0 0 1100 320"
            preserveAspectRatio="xMidYMid slice"
            role="img"
            aria-label="Illustration of a container ship at port with gantry cranes"
        >
            <rect width="1100" height="320" fill="#E4ECF3" />
            <circle cx="900" cy="64" r="36" fill="#F2E9D8" />
            {/* port cranes */}
            <g fill="#445463">
                <rect x="70" y="118" width="3" height="92" />
                <rect x="46" y="116" width="120" height="6" />
                <rect x="58" y="122" width="2" height="24" />
                <rect x="132" y="122" width="2" height="20" />
                <rect x="170" y="130" width="3" height="80" />
                <rect x="150" y="128" width="86" height="5" />
            </g>
            {/* hull */}
            <polygon points="270,200 830,200 792,232 308,232" fill="#2E3B4A" />
            <rect x="296" y="158" width="500" height="44" fill="#3C4A5C" />
            {/* containers */}
            <g>
                <rect x="318" y="126" width="40" height="32" fill="#8FA3B8" />
                <rect x="360" y="126" width="40" height="32" fill="#C7B299" />
                <rect x="402" y="126" width="40" height="32" fill="#7E93A8" />
                <rect x="444" y="126" width="40" height="32" fill="#B8A688" />
                <rect x="486" y="126" width="40" height="32" fill="#8FA3B8" />
                <rect x="528" y="126" width="40" height="32" fill="#C7B299" />
                <rect x="570" y="126" width="40" height="32" fill="#7E93A8" />
                <rect x="612" y="126" width="40" height="32" fill="#B8A688" />
                <rect x="654" y="126" width="40" height="32" fill="#8FA3B8" />
                <rect x="696" y="126" width="40" height="32" fill="#C7B299" />
                <rect x="318" y="94" width="40" height="32" fill="#7E93A8" />
                <rect x="360" y="94" width="40" height="32" fill="#B8A688" />
                <rect x="402" y="94" width="40" height="32" fill="#8FA3B8" />
                <rect x="444" y="94" width="40" height="32" fill="#C7B299" />
                <rect x="486" y="94" width="40" height="32" fill="#7E93A8" />
                <rect x="528" y="94" width="40" height="32" fill="#B8A688" />
                <rect x="570" y="94" width="40" height="32" fill="#8FA3B8" />
                <rect x="612" y="94" width="40" height="32" fill="#C7B299" />
                <rect x="654" y="94" width="40" height="32" fill="#7E93A8" />
                <rect x="696" y="94" width="40" height="32" fill="#B8A688" />
            </g>
            {/* superstructure */}
            <rect x="742" y="108" width="40" height="50" fill="#445463" />
            <rect x="752" y="98" width="20" height="12" fill="#445463" />
            {/* sea */}
            <rect x="0" y="210" width="1100" height="110" fill="#B9CAD9" />
            <rect x="0" y="208" width="1100" height="3" fill="#A7BCCF" />
            <g stroke="#9DB8CC" strokeWidth="2" fill="none">
                <path d="M40 252 q20 -8 40 0 t40 0 t40 0" />
                <path d="M320 272 q20 -8 40 0 t40 0 t40 0" />
                <path d="M720 256 q20 -8 40 0 t40 0 t40 0" />
                <path d="M980 280 q20 -8 40 0 t40 0" />
            </g>
        </svg>
    );
}