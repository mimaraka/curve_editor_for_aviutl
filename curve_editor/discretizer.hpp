#pragma once

#include "modifier_base.hpp"
#include <cereal/archives/binary.hpp>
#include <cereal/types/polymorphic.hpp>
#include "control_point.hpp"



namespace cved {
	// 離散化モディファイア—
	class Discretizer : public Modifier {
		uint32_t sampling_resolution_;
		uint32_t quantization_resolution_;

	public:
		Discretizer(
			uint32_t sampling_resolution = 10u,
			uint32_t quantization_resolution = 10u
		) noexcept;

		Discretizer(const Discretizer& discretizer) noexcept :
			Modifier{ discretizer },
			sampling_resolution_{ discretizer.sampling_resolution_ },
			quantization_resolution_{ discretizer.quantization_resolution_ }
		{}

		auto sampling_resolution() const noexcept { return sampling_resolution_; }
		void set_sampling_resolution(uint32_t sampling_resolution) noexcept { sampling_resolution_ = sampling_resolution; }

		auto quantization_resolution() const noexcept { return quantization_resolution_; }
		void set_quantization_resolution(uint32_t quantization_resolution) noexcept { quantization_resolution_ = quantization_resolution; }

		CurveFunction convert(const CurveFunction& function) const noexcept override;

		template <class Archive>
		void save(Archive& archive, const std::uint32_t) const {
			archive(
				cereal::base_class<Modifier>(this),
				sampling_resolution_,
				quantization_resolution_
			);
		}

		template <class Archive>
		void load(Archive& archive, const std::uint32_t) {
			archive(
				cereal::base_class<Modifier>(this),
				sampling_resolution_,
				quantization_resolution_
			);
		}
	};
}

CEREAL_CLASS_VERSION(cved::Discretizer, 0)
CEREAL_REGISTER_TYPE(cved::Discretizer)
CEREAL_REGISTER_POLYMORPHIC_RELATION(cved::Modifier, cved::Discretizer)