import { Injectable } from '@nestjs/common';

@Injectable()
export class MeetingsTemplate {
  render() {
    return <div>Meetings</div>;
  }
}
