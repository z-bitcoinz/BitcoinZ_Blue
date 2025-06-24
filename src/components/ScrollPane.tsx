import React, { Component } from "react";
import scrollbarStyles from "./ModernScrollbar.module.css";

type PaneState = {
  height: number;
};

type Props = {
  children: React.ReactNode;
  className?: string;
  offsetHeight: number;
  scrollbarType?: 'standard' | 'compact' | 'thin' | 'glass';
};

export default class ScrollPane extends Component<Props, PaneState> {
  constructor(props: Props) {
    super(props);

    this.state = { height: 0 };
  }

  componentDidMount() {
    this.updateDimensions();
    window.addEventListener("resize", this.updateDimensions);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateDimensions);
  }

  /**
   * Calculate & Update state of height, needed for the scrolling
   */
  updateDimensions = () => {
    // eslint-disable-next-line react/destructuring-assignment
    const updateHeight = window.innerHeight - this.props.offsetHeight;
    this.setState({ height: updateHeight });
  };

  render() {
    const { children, className, scrollbarType = 'standard' } = this.props;
    const { height } = this.state;

    // Determine which scrollbar style to apply
    const getScrollbarClass = () => {
      switch (scrollbarType) {
        case 'compact':
          return scrollbarStyles.modernScrollbarCompact;
        case 'thin':
          return scrollbarStyles.modernScrollbarThin;
        case 'glass':
          return scrollbarStyles.modernScrollbarGlass;
        default:
          return scrollbarStyles.modernScrollbar;
      }
    };

    const scrollbarClass = getScrollbarClass();
    const combinedClassName = className
      ? `${className} ${scrollbarClass} ${scrollbarStyles.scrollableContainer}`
      : `${scrollbarClass} ${scrollbarStyles.scrollableContainer}`;

    return (
      <div
        className={combinedClassName}
        style={{
          overflowY: "auto",
          overflowX: "hidden",
          height,
          scrollBehavior: "smooth"
        }}
      >
        {children}
      </div>
    );
  }
}
