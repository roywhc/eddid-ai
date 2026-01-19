import Svg, { G, Path } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface EddidLogoProps {
  width?: number;
  height?: number;
  style?: ViewStyle;
  color?: string;
  accentColor?: string;
}

export function EddidLogo({
  width = 200,
  height = 50,
  style,
  color = '#fff',
  accentColor = '#ffd100'
}: EddidLogoProps) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 576.55 143.49"
      style={style}>
      <G>
        <G>
          <Path
            fill={color}
            fillRule="evenodd"
            clipRule="evenodd"
            d="M105.49,129.52a76.56,76.56,0,0,0,17.69,13.74H0V.23H123.46a78.59,78.59,0,0,0-18,14,79.91,79.91,0,0,0-13,17.49h-61V56H84.13a96.55,96.55,0,0,0,0,31.46H31.46V111.8h61A80.32,80.32,0,0,0,105.49,129.52Z"
          />
          <Path
            fill={accentColor}
            fillRule="evenodd"
            clipRule="evenodd"
            d="M217.81,143.25H160.6c-19.82,0-36.16-6.74-49.44-20.43s-20-30.85-20-51.07,6.74-37.19,20-50.88S140.78.24,160.6.24h57.21Zm-32.69-31.46V31.7H160.6c-11.24,0-20.43,3.68-27.38,11-7.15,7.15-10.62,16.95-10.62,29s3.47,21.86,10.62,29.21c6.95,7.15,16.14,10.83,27.38,10.83Z"
          />
          <Path
            fill={color}
            fillRule="evenodd"
            clipRule="evenodd"
            d="M303.53,61.86V79.3H253.68V0H303V17.45H271.81V30.59h28.32V47.81H271.81v14Z"
          />
          <Path
            fill={color}
            fillRule="evenodd"
            clipRule="evenodd"
            d="M384,39.65c0,22.43-16.65,39.65-38.52,39.65H313.72V0h31.72C367.31,0,384,17.22,384,39.65Zm-17.44,0c0-13.59-8.62-22.2-21.08-22.2H331.85V61.86h13.59C357.9,61.86,366.52,53.25,366.52,39.65Z"
          />
          <Path
            fill={color}
            fillRule="evenodd"
            clipRule="evenodd"
            d="M464.4,39.65c0,22.43-16.66,39.65-38.52,39.65H394.15V0h31.73C447.74,0,464.4,17.22,464.4,39.65Zm-17.45,0c0-13.59-8.61-22.2-21.07-22.2h-13.6V61.86h13.6C438.34,61.86,447,53.25,447,39.65Z"
          />
          <Path
            fill={color}
            fillRule="evenodd"
            clipRule="evenodd"
            d="M492.72,0V79.3H474.59V0Z"
          />
          <Path
            fill={color}
            fillRule="evenodd"
            clipRule="evenodd"
            d="M576.55,39.65c0,22.43-16.65,39.65-38.52,39.65H506.31V0H538C559.9,0,576.55,17.22,576.55,39.65Zm-17.45,0c0-13.59-8.61-22.2-21.07-22.2H524.44V61.86H538C550.49,61.86,559.1,53.25,559.1,39.65Z"
          />
          <Path
            fill={color}
            fillRule="evenodd"
            clipRule="evenodd"
            d="M264.23,106.58v8.89h17.13v10.16H264.23v16.94H253.68V96.43h28v10.15Z"
          />
          <Path
            fill={color}
            fillRule="evenodd"
            clipRule="evenodd"
            d="M298.5,96.43v46.14H288V96.43Z"
          />
          <Path
            fill={color}
            fillRule="evenodd"
            clipRule="evenodd"
            d="M342.65,96.43v46.14h-7.91l-17.79-25v25H306.4V96.43h7.91l17.8,25v-25Z"
          />
          <Path
            fill={color}
            fillRule="evenodd"
            clipRule="evenodd"
            d="M377.58,135.32H360.45l-2.31,7.25H346.6l15.69-46.14h13.45l15.69,46.14H379.89Zm-3.16-9.89L369,108.49l-5.4,16.94Z"
          />
          <Path
            fill={color}
            fillRule="evenodd"
            clipRule="evenodd"
            d="M431.63,96.43v46.14h-7.91l-17.8-25v25H395.37V96.43h7.91l17.8,25v-25Z"
          />
          <Path
            fill={color}
            fillRule="evenodd"
            clipRule="evenodd"
            d="M437.55,119.5c0-13.58,10.09-24,24-24a23,23,0,0,1,19.78,10.68l-9.1,5.27c-2-3.56-6-5.66-10.68-5.66-8.17,0-13.44,5.47-13.44,13.71s5.27,13.71,13.44,13.71c4.68,0,8.71-2.11,10.68-5.67l9.1,5.27a22.85,22.85,0,0,1-19.78,10.68C447.64,143.49,437.55,133.07,437.55,119.5Z"
          />
          <Path
            fill={color}
            fillRule="evenodd"
            clipRule="evenodd"
            d="M496.8,96.43v46.14H486.26V96.43Z"
          />
          <Path
            fill={color}
            fillRule="evenodd"
            clipRule="evenodd"
            d="M531.74,135.32H514.6l-2.31,7.25H500.76l15.68-46.14h13.45l15.69,46.14H534Zm-3.17-9.89-5.4-16.94-5.41,16.94Z"
          />
          <Path
            fill={color}
            fillRule="evenodd"
            clipRule="evenodd"
            d="M576.55,132.41v10.16h-27V96.43h10.55v36Z"
          />
        </G>
      </G>
    </Svg>
  );
}
