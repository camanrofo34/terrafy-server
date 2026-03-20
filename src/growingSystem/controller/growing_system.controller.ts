import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from "@nestjs/common";
import type { CreateGrowingSystemRequest } from "../model/dto/request/CreateGrowingSystemRequest.types";
import { ApiBearerAuth, ApiBody, ApiOperation } from "@nestjs/swagger";
import { GrowingSystemService } from "../services/growing_system.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import type { UpdateGrowingSystemRequest } from "../model/dto/request/UpdateGrowingSystemRequest.types";

@Controller('api/growing-systems')
export class GrowingSystemController {

    constructor(
        private readonly growingSystemService: GrowingSystemService
    ){}

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth("access-token")
    @HttpCode(201)
    @ApiOperation({
        summary: "Create a new growing system",
        description: "Creates a new growing system associated with a user."
    })
    @ApiBody({
        description: "Data for creating a new growing system",
        schema: {
            type: "object",
            required: ["userId", "name", "location"],
            properties: {
                userId: { type: "number", example: 1 },
                name: { type: "string", example: "My Greenhouse" },
                location: { type: "string", example: "Backyard" },
                description: { type: "string", example: "A small greenhouse for growing herbs." }
            }
        }
    })
    createGrowingSystem(@Body() payload: CreateGrowingSystemRequest){
        return this.growingSystemService.createGrowingSystem(payload);
    }

    @Get(':userId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth("access-token")
    @ApiOperation({
        summary: "Get growing systems for a user",
        description: "Retrieves all growing systems associated with a specific user."
    })
    getGrowingSystemsByUserId(@Param('userId') userId: number) {
        return this.growingSystemService.getGrowingSystemsByUserId(userId);
    }

    @Patch(':systemId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth("access-token")  
    @ApiOperation({
        summary: "Update a growing system",
        description: "Updates the details of an existing growing system."
    })
    @ApiBody({
        description: "Data for updating a growing system",
        schema: {
            type: "object",
            properties: {
                userId: { type: "number", example: 1 },
                name: { type: "string", example: "Updated Greenhouse" },
                location: { type: "string", example: "Updated Backyard" },
                description: { type: "string", example: "An updated description for the greenhouse." }
            }
        }
    })
    updateGrowingSystem(@Param('systemId') systemId: number, @Body() payload: UpdateGrowingSystemRequest) {
        return this.growingSystemService.updateGrowingSystem(systemId, payload);
    }

    @Delete(':systemId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth("access-token")
    @ApiOperation({
        summary: "Delete a growing system",
        description: "Deletes an existing growing system by its ID."
    })
    @HttpCode(204)
    deleteGrowingSystem(@Param('systemId') systemId: number) {
        return this.growingSystemService.deleteGrowingSystem(systemId);
    }
}