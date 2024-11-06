#pragma once

#include <cstdint>
#include <Windows.h>



namespace cved {
	class KeyStateObserver {
		const std::vector<int32_t> key_codes_;
		bool current_pressed_ = false;
		bool last_pressed_ = false;

	public:
		KeyStateObserver(std::initializer_list<int32_t> key_codes) :
			key_codes_{ key_codes }
		{}

		void update() noexcept {
			std::vector<SHORT> states;
			states.reserve(key_codes_.size());
			for (auto key_code : key_codes_) {
				states.emplace_back(::GetAsyncKeyState(key_code));
			}
			last_pressed_ = current_pressed_;
			current_pressed_ = std::all_of(states.begin(), states.end(), [](auto state) { return state & 0x8000; });
		}

		bool is_key_pressed() { return current_pressed_; }
		bool is_key_down() { return !last_pressed_ and current_pressed_; }
		bool is_key_up() { return last_pressed_ and !current_pressed_; }
	};
} // namespace cved