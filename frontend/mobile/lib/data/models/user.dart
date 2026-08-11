class UserModel {
  const UserModel({
    required this.id,
    required this.email,
    required this.role,
    this.firstName,
    this.lastName,
    this.phone,
    this.storeId,
  });

  final String id;
  final String email;
  final String role;
  final String? firstName;
  final String? lastName;
  final String? phone;
  final String? storeId;

  String get displayName {
    if (firstName != null && lastName != null) {
      return '$firstName $lastName';
    }
    return email.split('@').first;
  }

  String get initials {
    if (firstName != null && firstName!.isNotEmpty) {
      final last = lastName?.isNotEmpty == true ? lastName![0] : '';
      return '${firstName![0]}$last'.toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  }

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      email: json['email'] as String,
      role: json['role'] as String,
      firstName: json['firstName'] as String?,
      lastName: json['lastName'] as String?,
      phone: json['phone'] as String?,
      storeId: json['storeId'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'role': role,
        'firstName': firstName,
        'lastName': lastName,
        'phone': phone,
        'storeId': storeId,
      };
}

class AuthResponse {
  const AuthResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });

  final String accessToken;
  final String refreshToken;
  final UserModel user;

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
      user: UserModel.fromJson(json['user'] as Map<String, dynamic>),
    );
  }
}
