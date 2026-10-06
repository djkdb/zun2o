import { Component, type ReactNode } from 'react';

/**
 * If anything in the phone throws, show a dead phone instead of a blank page:
 * progress is in localStorage, so reloading picks the night up where it was.
 */
export class CrashScreen extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error(error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="crash" role="alert">
        <p className="crash-pct">12%</p>
        <p>화면이 멈췄습니다.</p>
        <p className="crash-fine">진행 기록은 이 기기에 남아 있습니다. 다시 켜면 이어서 할 수 있습니다.</p>
        <button type="button" className="primary" onClick={() => window.location.reload()}>
          다시 켜기
        </button>
      </div>
    );
  }
}
