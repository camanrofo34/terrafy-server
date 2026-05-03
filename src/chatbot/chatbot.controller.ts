import { Body, Controller, HttpCode, Post } from "@nestjs/common";

@Controller('api/ai')
export class ChatbotController {

    constructor() {}

    @Post('/chat')
    @HttpCode(200)
    async sendMessage( @Body() payload: {message: string, system_id: string}) {
        return await fetch('http://localhost:8000/ai/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        }).then(res => res.json());
    }
}