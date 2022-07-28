/// <reference types="react" />
interface TProps {
    fixed?: boolean;
    className: string;
    selectedItemClassName: string;
    itemClassName: string;
}
export declare function RichMentionsAutocomplete<T = object>({ fixed, className, itemClassName, selectedItemClassName, }: TProps): JSX.Element | null;
export {};
