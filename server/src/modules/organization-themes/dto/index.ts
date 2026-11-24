import {
  IsString,
  IsOptional,
  ValidateNested,
  MinLength,
  MaxLength,
  IsBoolean,
  IsNumber,
  IsIn,
  IsDefined,
  ValidateIf,
  IsArray,
  ArrayMaxSize,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

class Color {
  @IsString()
  light: string;

  @IsString()
  dark: string;
}

class Colors {
  @ValidateNested()
  @Type(() => Color)
  primary: Color;

  @IsOptional()
  @ValidateNested()
  @Type(() => Color)
  secondary?: Color;

  @IsOptional()
  @ValidateNested()
  @Type(() => Color)
  tertiary?: Color;
}

class TextColors {
  @ValidateNested()
  @Type(() => Color)
  primary: Color;

  @IsOptional()
  @ValidateNested()
  @Type(() => Color)
  placeholder?: Color;

  @IsOptional()
  @ValidateNested()
  @Type(() => Color)
  disabled?: Color;
}

class Text {
  @IsString()
  font: string;

  @ValidateNested()
  @Type(() => TextColors)
  colors: TextColors;
}

class BorderRadius {
  @IsNumber()
  default: number;

  @IsNumber()
  small: number;

  @IsNumber()
  large: number;
}

class BorderColors {
  @ValidateNested()
  @Type(() => Color)
  default: Color;

  @IsOptional()
  @ValidateNested()
  @Type(() => Color)
  weak?: Color;

  @IsOptional()
  @ValidateNested()
  @Type(() => Color)
  disabled?: Color;
}

class Border {
  @ValidateNested()
  @Type(() => BorderRadius)
  radius: BorderRadius;

  @ValidateNested()
  @Type(() => BorderColors)
  colors: BorderColors;
}

class SystemStatusColors {
  @ValidateNested()
  @Type(() => Color)
  success: Color;

  @IsOptional()
  @ValidateNested()
  @Type(() => Color)
  error?: Color;

  @IsOptional()
  @ValidateNested()
  @Type(() => Color)
  warning?: Color;
}

class SystemStatus {
  @ValidateNested()
  @Type(() => SystemStatusColors)
  colors: SystemStatusColors;
}

class AppBackgroundColor {
  @IsString()
  light: string;

  @IsString()
  dark: string;
}

class SurfaceColors {
  @ValidateNested()
  @Type(() => AppBackgroundColor)
  appBackground: AppBackgroundColor;

  @ValidateNested()
  @Type(() => Color)
  surface1: Color;

  @ValidateNested()
  @Type(() => Color)
  surface2: Color;

  @ValidateNested()
  @Type(() => Color)
  surface3: Color;
}

class Surface {
  @ValidateNested()
  @Type(() => SurfaceColors)
  colors: SurfaceColors;
}

class Brand {
  @ValidateNested()
  @Type(() => Colors)
  colors: Colors;
}

// Theme definition v2 colours: `colors.<group>.<token>` (packages/widget-definitions/src/theme.js). Strong is the old
// default border; On solid is new.
class V2TextColors {
  @ValidateNested()
  @Type(() => Color)
  primary: Color;

  @IsOptional()
  @ValidateNested()
  @Type(() => Color)
  placeholder?: Color;

  @IsOptional()
  @ValidateNested()
  @Type(() => Color)
  onSolid?: Color;
}

class V2BorderColors {
  @ValidateNested()
  @Type(() => Color)
  strong: Color;

  @IsOptional()
  @ValidateNested()
  @Type(() => Color)
  weak?: Color;
}

class ThemeColors {
  @ValidateNested()
  @Type(() => Colors)
  brand: Colors;

  @ValidateNested()
  @Type(() => V2TextColors)
  text: V2TextColors;

  @ValidateNested()
  @Type(() => SurfaceColors)
  surface: SurfaceColors;

  @ValidateNested()
  @Type(() => V2BorderColors)
  border: V2BorderColors;

  @ValidateNested()
  @Type(() => SystemStatusColors)
  systemStatus: SystemStatusColors;
}

// Theme definition v2 border radii and box shadows: named lists, built-in items first (packages/widget-definitions
// src/theme.js). `id` is stable across renames; built-ins are `locked` (never removed; the server puts them back).
class ThemeListItem {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  id: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsBoolean()
  locked?: boolean;
}

class BorderRadiusItem extends ThemeListItem {
  @IsNumber()
  @Min(0)
  @Max(999)
  value: number;
}

class ShadowItem extends ThemeListItem {
  @IsNumber()
  @Min(-999)
  @Max(999)
  x: number;

  @IsNumber()
  @Min(-999)
  @Max(999)
  y: number;

  @IsNumber()
  @Min(0)
  @Max(999)
  blur: number;

  @IsNumber()
  @Min(-999)
  @Max(999)
  spread: number;

  @ValidateNested()
  @Type(() => Color)
  color: Color;
}

/** A theme holds its colours in `colors` (v2), in the old `<group>.colors` groups, or in both: rows keep the old groups
 *  until a cleanup migration, and tooljet-mcp and old bundles still send them alone. Either shape must be present. */
export class Definition {
  @IsOptional()
  @IsIn([2])
  version?: 2;

  @IsOptional()
  @ValidateNested()
  @Type(() => ThemeColors)
  colors?: ThemeColors;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => BorderRadiusItem)
  borderRadius?: BorderRadiusItem[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ShadowItem)
  shadows?: ShadowItem[];

  // Required unless `colors` is given; validated whenever sent.
  @ValidateIf((definition: Definition) => !definition.colors || definition.brand !== undefined)
  @IsDefined()
  @ValidateNested()
  @Type(() => Brand)
  brand: Brand;

  @ValidateNested()
  @Type(() => Text)
  text: Text;

  @ValidateNested()
  @Type(() => Border)
  border: Border;

  @ValidateNested()
  @Type(() => SystemStatus)
  systemStatus: SystemStatus;

  @ValidateNested()
  @Type(() => Surface)
  surface: Surface;
}

export class CreateThemeDto {
  @IsString()
  @MinLength(5, { message: 'Theme name should contain more than 5 characters' })
  @MaxLength(100, { message: 'Theme name should be Max 100 characters' })
  name: string;

  @IsString()
  organizationId: string;

  @ValidateNested()
  @Type(() => Definition)
  definition: Definition;

  @IsOptional()
  isDefault?: boolean;
}

export class UpdateThemeDefinitionDto {
  @ValidateNested()
  @Type(() => Definition)
  definition: Definition;
}

export class UpdateThemeNameDto {
  @IsString()
  name: string;
}

export class UpdateThemeDefaultDto {
  @IsBoolean()
  isDefault: boolean;
}
