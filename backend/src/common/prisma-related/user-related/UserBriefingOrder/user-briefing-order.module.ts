// supabase.module.ts
import { Module } from '@nestjs/common';
import { UserBriefingOrderService } from './user-briefing-order.service';

@Module({
  providers: [UserBriefingOrderService],
  exports: [UserBriefingOrderService],
})
export class UserBriefingOrderModule {}
