import { IsDateString, IsNotEmpty, IsString, Matches } from 'class-validator';

export class AvailabilityCreateDto {
    @IsString()
    @IsNotEmpty()
    employeeId: string;

    @IsDateString()
    @IsNotEmpty()
    availableDate: string; // Định dạng YYYY-MM-DD

    @IsString()
    @IsNotEmpty()
    @Matches(/^([01]\d|2[0-3]):?([0-5]\d)$/, { message: 'StartTime must be HH:mm' })
    startTime: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^([01]\d|2[0-3]):?([0-5]\d)$/, { message: 'EndTime must be HH:mm' })
    endTime: string;
}