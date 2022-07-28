import { HTMLProps } from 'react';
interface TProps extends HTMLProps<HTMLDivElement> {
    defaultValue?: string;
    singleLine: Boolean;
    onEnter?: () => void;
}
export declare function RichMentionsInput({ defaultValue, singleLine, onEnter, ...divAttributes }: TProps): JSX.Element;
export {};
