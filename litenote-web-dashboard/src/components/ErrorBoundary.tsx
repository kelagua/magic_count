import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button, Result } from 'antd';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * 全局错误边界组件
 * 捕获子组件树中的 JavaScript 错误，防止整个应用白屏崩溃
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 生产环境可接入日志服务
    console.error('[ErrorBoundary] 捕获到未处理错误:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '48px 24px', maxWidth: 600, margin: '0 auto' }}>
          <Result
            status="error"
            title="页面出现错误"
            subTitle="抱歉，页面遇到了意外错误。请尝试刷新页面或返回首页。"
            extra={[
              <Button type="primary" key="reload" onClick={this.handleReload}>
                刷新页面
              </Button>,
              <Button key="reset" onClick={this.handleReset}>
                重试
              </Button>,
              <Button
                key="home"
                type="link"
                onClick={() => {
                  window.location.href = '/';
                }}
              >
                返回首页
              </Button>,
            ]}
          />
          {this.state.error && (
            <details style={{ marginTop: 16, whiteSpace: 'pre-wrap', fontSize: 12 }}>
              <summary style={{ cursor: 'pointer', color: '#999' }}>
                错误详情（仅开发环境可见）
              </summary>
              <p style={{ color: '#ff4d4f' }}>{this.state.error.toString()}</p>
              {this.state.errorInfo && (
                <pre style={{ color: '#666', fontSize: 11 }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;