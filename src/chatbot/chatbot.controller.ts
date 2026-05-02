import { Body, HttpCode, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";

export default class ChatbotController {

    constructor(
        private readonly chatbotService: any
    ){}

    @Post('/message')
    @UseGuards(JwtAuthGuard)
    @HttpCode(200)
    async sendMessage(@Req() req: Request, @Body() payload: any) {
        return await this.chatbotService.sendMessage(payload, (req as any).user);
    }
}