#pragma once

#include <stdint.h>


namespace cved {
	enum class EditMode : uint32_t {
		Normal,
		Value,
		Bezier,
		Elastic,
		Bounce,
		Script,
		NumEditMode
	};

	enum class CurveSegmentType : uint32_t {
		Linear,
		Bezier,
		Elastic,
		Bounce,
		NumCurveSegmentType
	};

	enum class IDCurveType : uint32_t {
		Normal,
		Value,
		Script
	};

	enum class ModifierType : uint32_t {
		Discretization,
		Noise,
		SineWave,
		SquareWave,
		NumModifierType
	};

	enum class WindowCommand: uint32_t {
		Update						= 0x0800,
		Reverse						= 0x0806,
		ChangeId					= 0x0809,
		Selected					= 0x080a,
		ChangeEditMode				= 0x080b,
		ChangeApplyMode				= 0x0900,
		CurveSegmentTypeLinear		= 0x0a00,
		CurveSegmentTypeBezier		= 0x0a01,
		CurveSegmentTypeElastic		= 0x0a02,
		CurveSegmentTypeBounce		= 0x0a03,
		RedrawAviutl				= 0x0b02,
		MovePreset					= 0x0b15,
		ChangeColor					= 0x0b16,
		LoadConfig					= 0x0b18,
		SaveConfig					= 0x0b19,
		Reload						= 0x0b1e,
		StartDnd					= 0x0b1f,
		UpdateColorScheme			= 0x0b20,
		UpdateHandlePos				= 0x0b21,
		UpdateAxisLabelVisibility	= 0x0b22,
		UpdateHandleVisibility		= 0x0b23,
		ApplyPreferences			= 0x0b24,
		UpdateHandles				= 0x0b25
	};

	enum class ThemeId {
		System,
		Dark,
		Light,
		NumThemeId
	};

	enum class LayoutMode {
		Vertical,
		Horizontal
	};

	enum class ApplyMode {
		Normal,
		IgnoreMidPoint,
		Interpolate,
		NumApplyMode
	};

	enum class Language {
		Automatic,
		Japanese,
		English,
		Korean
	};
}