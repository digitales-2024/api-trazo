import { Injectable } from '@nestjs/common';
import * as Fs from 'fs';
import * as Path from 'path';

@Injectable()
export class DesignProjectsTemplate {
  /**
   * Renders the skeleton of a simple html page.
   * It includes the tailwindcss output.
   *
   * @param param0 An object with children to render inside the skeleton
   */
  public static skeleton({ children }: { children: JSX.Element }): JSX.Element {
    // Loads the tailwind output to use in the pdf rendering.
    // Last I measured, this file had a size of 6.8KiB.
    // Since we don't expect PDF generation to be a feature used
    // constantly, we rather incur a speed penalty loading the file
    // over and over rather than using 6.8KiB additional RAM.
    let tailwindFile = '';
    try {
      tailwindFile = Fs.readFileSync(
        Path.join(process.cwd(), 'static', 'tailwind-output.css'),
      ).toString();
    } catch (e) {
      console.error('Error loading tailwind file:');
      console.error(e);
    }

    return (
      <>
        {'<!DOCTYPE html>'}
        <head>
          <style safe>{tailwindFile}</style>
          <style>
            {`@media print {
              @page {
                  size: A4 portrait;
                  margin-top: 15mm;
                  margin-bottom: 15mm;
              }
            }`}
          </style>
        </head>
        <body style="width: 297mm;">{children}</body>
      </>
    );
  }
}
