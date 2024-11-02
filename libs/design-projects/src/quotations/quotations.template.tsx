import { Injectable } from '@nestjs/common';

@Injectable()
export class QuotationTemplate {
  private static Skeleton({ children }: { children: JSX.Element }) {
    return (
      <>
        {'<!DOCTYPE html>'}
        <head></head>
        <body>{children}</body>
      </>
    );
  }

  renderPdf() {
    return (
      <QuotationTemplate.Skeleton>
        <div>
          <h1>:D (JSX PDF renderer)</h1>
        </div>
      </QuotationTemplate.Skeleton>
    );
  }
}
