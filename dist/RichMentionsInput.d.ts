import { HTMLProps } from 'react';
interface TProps extends HTMLProps<HTMLDivElement> {
    defaultValue?: string;
    singleLine?: Boolean;
    placeholder?: string;
    className?: string;
    onEnter?: () => void;
}
export declare function RichMentionsInput({ defaultValue, singleLine, placeholder, className, onEnter, ...divAttributes }: TProps): JSX.Element;
export {};
