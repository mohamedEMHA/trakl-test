import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { withAlpha } from '@/lib/trackers';

type SparklineProps = {
  data: number[];
  color: string;
  width?: number;
  height?: number;
  /** Render a soft gradient fill under the line. */
  fill?: boolean;
};

/**
 * Tiny trend line for tracker cards. Pure SVG, no deps beyond react-native-svg
 * (already used by Progress rings). Renders a smooth-ish polyline normalized to
 * the component box; a flat series draws a centered baseline.
 */
export function Sparkline({ data, color, width = 96, height = 32, fill = true }: SparklineProps) {
  const points = data.length > 0 ? data : [0, 0];
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const stepX = points.length > 1 ? width / (points.length - 1) : width;
  const pad = 3;
  const usableH = height - pad * 2;

  const coords = points.map((v, i) => {
    const x = i * stepX;
    // Invert Y (SVG origin is top-left); flat series sits mid-box.
    const norm = max === min ? 0.5 : (v - min) / range;
    const y = pad + (1 - norm) * usableH;
    return { x, y };
  });

  const linePath = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(' ');

  const areaPath = `${linePath} L ${width.toFixed(1)} ${height} L 0 ${height} Z`;
  const gradId = `spark-${color.replace(/[^a-z0-9]/gi, '')}`;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        {fill ? (
          <Defs>
            <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity={0.22} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </LinearGradient>
          </Defs>
        ) : null}
        {fill ? <Path d={areaPath} fill={`url(#${gradId})`} /> : null}
        <Path
          d={linePath}
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

// Re-export so callers importing alongside withAlpha is convenient.
export { withAlpha };
